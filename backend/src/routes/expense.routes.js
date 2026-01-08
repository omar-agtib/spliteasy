const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { auth } = require("../middleware/auth");
const { requireRoomMember } = require("../middleware/roomMember");
const Expense = require("../models/Expense");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { emitToRoom } = require("../socket");
const { createExpenseSchema } = require("../validation/schemas");

const uploadDir = path.join(__dirname, "../../uploads/receipts");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const name = `receipt_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
});

router.get("/room/:roomId", auth, requireRoomMember, async (req, res) => {
  const expenses = await Expense.find({
    roomId: req.params.roomId,
    isDeleted: false,
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();
  res.json({ expenses });
});

router.post("/", auth, async (req, res) => {
  const { value, error } = createExpenseSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const room = await Room.findById(value.roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isMember = room.members.some(
    (m) => String(m.userId) === String(req.user._id)
  );
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  let splitBetween = [];

  if ((value.splitMode || "equal") === "unequal") {
    if (!value.splitBetween || value.splitBetween.length === 0) {
      return res
        .status(400)
        .json({ message: "splitBetween required for unequal mode" });
    }

    const sum = value.splitBetween.reduce(
      (s, x) => s + Number(x.amount || 0),
      0
    );
    const roundedSum = Math.round(sum * 100) / 100;
    const amt = Math.round(Number(value.amount) * 100) / 100;

    if (Math.abs(roundedSum - amt) > 0.01) {
      return res
        .status(400)
        .json({ message: "Unequal split amounts must sum to total amount" });
    }

    splitBetween = value.splitBetween.map((x) => ({
      userId: x.userId,
      amount: Math.round(Number(x.amount) * 100) / 100,
      settled: false,
    }));
  } else {
    const users = value.splitBetweenUserIds || [];
    if (users.length === 0)
      return res
        .status(400)
        .json({ message: "splitBetweenUserIds required for equal mode" });

    const per = Math.round((value.amount / users.length) * 100) / 100;
    const remainder =
      Math.round((value.amount - per * users.length) * 100) / 100;

    splitBetween = users.map((uid, idx) => {
      const a =
        idx === users.length - 1
          ? Math.round((per + remainder) * 100) / 100
          : per;
      return { userId: uid, amount: a, settled: false };
    });
  }

  const expense = await Expense.create({
    roomId: value.roomId,
    description: value.description,
    amount: value.amount,
    currency: room.currency,
    category: value.category || "other",
    paidBy: value.paidBy,
    splitBetween,
    date: value.date || new Date(),
    createdBy: req.user._id,
  });

  const sys = await Message.create({
    roomId: value.roomId,
    type: "system",
    message: `${req.user.name} added: ${value.description} (${value.amount} ${room.currency})`,
  });

  emitToRoom(value.roomId, "expense_added", expense);
  emitToRoom(value.roomId, "new_message", sys);

  res.json({ expense });
});

// Mark YOUR share as settled for this expense (or admin can settle someone by userId in body)
router.post("/:expenseId/settle", auth, async (req, res) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense || expense.isDeleted)
    return res.status(404).json({ message: "Expense not found" });

  const room = await Room.findById(expense.roomId);
  const isMember = room.members.some(
    (m) => String(m.userId) === String(req.user._id)
  );
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  const targetUserId = req.body.userId
    ? String(req.body.userId)
    : String(req.user._id);

  const split = expense.splitBetween.find(
    (s) => String(s.userId) === targetUserId
  );
  if (!split)
    return res.status(404).json({ message: "Split not found for user" });

  split.settled = true;
  await expense.save();

  const sys = await Message.create({
    roomId: expense.roomId,
    type: "system",
    message: `✅ ${req.user.name} marked a share as settled.`,
  });

  emitToRoom(expense.roomId, "expense_updated", expense);
  emitToRoom(expense.roomId, "new_message", sys);

  res.json({ expense });
});

// Upload receipt image (MVP local storage)
router.post(
  "/:expenseId/receipt",
  auth,
  upload.single("receipt"),
  async (req, res) => {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense || expense.isDeleted)
      return res.status(404).json({ message: "Expense not found" });

    const room = await Room.findById(expense.roomId);
    const isMember = room.members.some(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const base = (
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`
    ).replace(/\/$/, "");
    const url = `${base}/uploads/receipts/${req.file.filename}`;

    expense.receiptImage = url;
    await expense.save();

    emitToRoom(expense.roomId, "expense_updated", expense);
    res.json({ expense });
  }
);

router.put("/:expenseId", auth, async (req, res) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense || expense.isDeleted)
    return res.status(404).json({ message: "Expense not found" });

  const room = await Room.findById(expense.roomId);
  const isMember = room.members.some(
    (m) => String(m.userId) === String(req.user._id)
  );
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  if (String(expense.createdBy) !== String(req.user._id))
    return res.status(403).json({ message: "Only creator can edit in MVP" });

  const { description, category, date } = req.body;
  if (typeof description === "string") expense.description = description.trim();
  if (typeof category === "string") expense.category = category;
  if (date) expense.date = new Date(date);

  await expense.save();
  emitToRoom(expense.roomId, "expense_updated", expense);
  res.json({ expense });
});

router.delete("/:expenseId", auth, async (req, res) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense || expense.isDeleted)
    return res.status(404).json({ message: "Expense not found" });

  const room = await Room.findById(expense.roomId);
  const isMember = room.members.some(
    (m) => String(m.userId) === String(req.user._id)
  );
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  if (String(expense.createdBy) !== String(req.user._id))
    return res.status(403).json({ message: "Only creator can delete in MVP" });

  expense.isDeleted = true;
  await expense.save();
  emitToRoom(expense.roomId, "expense_deleted", {
    expenseId: String(expense._id),
  });

  res.json({ ok: true });
});

module.exports = router;
