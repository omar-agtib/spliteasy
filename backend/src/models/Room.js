// backend/src/models/Room.js

const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    type: {
      type: String,
      enum: ["trip", "roommates", "general"],
      default: "general",
    },
    currency: { type: String, default: "MAD" },
    members: { type: [MemberSchema], default: [] },
    inviteCode: { type: String, unique: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
