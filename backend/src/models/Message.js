// backend/src/models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Message", MessageSchema);
