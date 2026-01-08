const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { requireRoomMember } = require("../middleware/roomMember");
const Message = require("../models/Message");
const { messageSchema } = require("../validation/schemas");
const { emitToRoom } = require("../socket");

router.get("/room/:roomId", auth, requireRoomMember, async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ messages: messages.reverse() });
});

router.post("/", auth, async (req, res) => {
  const { value, error } = messageSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  req.params.roomId = value.roomId;
  await requireRoomMember(req, res, async () => {
    const msg = await Message.create({
      roomId: value.roomId,
      senderId: req.user._id,
      message: value.message,
      type: "text",
    });
    emitToRoom(value.roomId, "new_message", msg);
    res.json({ message: msg });
  });
});

module.exports = router;
