const router = require("express").Router();
const { auth } = require("../middleware/auth");
const Room = require("../models/Room");
const Expense = require("../models/Expense");
const Message = require("../models/Message");
const User = require("../models/User");
const { generateInviteCode } = require("../utils/inviteCode");
const { computeBalances, simplifyDebts } = require("../utils/balances");
const { createRoomSchema, joinRoomSchema } = require("../validation/schemas");

router.get("/", auth, async (req, res) => {
  const rooms = await Room.find({ "members.userId": req.user._id, isArchived: false })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ rooms });
});

router.post("/", auth, async (req, res) => {
  const { value, error } = createRoomSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  let inviteCode = generateInviteCode();
  while (await Room.findOne({ inviteCode })) inviteCode = generateInviteCode();

  const room = await Room.create({
    ...value,
    inviteCode,
    createdBy: req.user._id,
    members: [{ userId: req.user._id, role: "admin" }],
  });

  await Message.create({ roomId: room._id, type: "system", message: `${req.user.name} created the room.` });
  res.json({ room });
});

router.post("/join", auth, async (req, res) => {
  const { value, error } = joinRoomSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const room = await Room.findOne({ inviteCode: value.inviteCode });
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isMember = room.members.some((m) => String(m.userId) === String(req.user._id));
  if (!isMember) {
    room.members.push({ userId: req.user._id, role: "member" });
    await room.save();
    await Message.create({ roomId: room._id, type: "system", message: `${req.user.name} joined the room.` });
  }

  res.json({ room });
});

router.get("/:roomId", auth, async (req, res) => {
  const room = await Room.findById(req.params.roomId).lean();
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isMember = room.members.some((m) => String(m.userId) === String(req.user._id));
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  const memberIds = room.members.map(m => m.userId);
  const users = await User.find({ _id: { $in: memberIds } }).select("_id name").lean();

  res.json({ room, users });
});

router.get("/:roomId/summary", auth, async (req, res) => {
  const room = await Room.findById(req.params.roomId).lean();
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isMember = room.members.some((m) => String(m.userId) === String(req.user._id));
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  const expenses = await Expense.find({ roomId: room._id, isDeleted: false }).lean();
  const memberIds = room.members.map((m) => m.userId);
  const balances = computeBalances(expenses, memberIds);
  const transfers = simplifyDebts(balances);
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  res.json({ totalSpent: Math.round(totalSpent * 100) / 100, balances, transfers });
});

module.exports = router;
