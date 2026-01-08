const mongoose = require("mongoose");

const SplitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    settled: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExpenseSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "MAD" },
    category: {
      type: String,
      enum: ["food", "transport", "accommodation", "entertainment", "utilities", "groceries", "other"],
      default: "other",
    },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: { type: [SplitSchema], default: [] },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
