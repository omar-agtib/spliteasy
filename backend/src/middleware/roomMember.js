const mongoose = require("mongoose");
const Room = require("../models/Room");

async function requireRoomMember(req, res, next) {
  const roomId = req.params.roomId || req.body.roomId || req.query.roomId;

  if (!roomId) {
    return res.status(400).json({ message: "roomId is required" });
  }

  // Prevent Mongoose CastError (e.g. roomId = "chat")
  if (!mongoose.isValidObjectId(roomId)) {
    return res.status(400).json({ message: "Invalid roomId" });
  }

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isMember = room.members.some(
    (m) => String(m.userId) === String(req.user._id)
  );
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  req.room = room;
  next();
}

module.exports = { requireRoomMember };
