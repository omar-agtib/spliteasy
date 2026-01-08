const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().min(6).max(20).optional(),
  password: Joi.string().min(6).max(64).required(),
  language: Joi.string().valid("en", "fr", "ar", "darija").optional(),
}).or("email", "phone");

const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().min(6).max(20).optional(),
  password: Joi.string().min(6).max(64).required(),
}).or("email", "phone");

const createRoomSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(200).allow("").optional(),
  type: Joi.string().valid("trip", "roommates", "general").optional(),
  currency: Joi.string().min(2).max(6).optional(),
});

const joinRoomSchema = Joi.object({
  inviteCode: Joi.string().length(6).required(),
});

/**
 * Expense payload supports:
 * - equal: splitBetweenUserIds: string[]
 * - unequal: splitBetween: [{ userId, amount }]
 */
const createExpenseSchema = Joi.object({
  roomId: Joi.string().required(),
  description: Joi.string().min(1).max(120).required(),
  amount: Joi.number().positive().required(),
  category: Joi.string()
    .valid(
      "food",
      "transport",
      "accommodation",
      "entertainment",
      "utilities",
      "groceries",
      "other"
    )
    .optional(),
  paidBy: Joi.string().required(),
  date: Joi.date().optional(),

  splitMode: Joi.string().valid("equal", "unequal").optional().default("equal"),

  splitBetweenUserIds: Joi.array().items(Joi.string()).min(1).optional(),
  splitBetween: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .min(1)
    .optional(),
});

const messageSchema = Joi.object({
  roomId: Joi.string().required(),
  message: Joi.string().min(1).max(500).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createRoomSchema,
  joinRoomSchema,
  createExpenseSchema,
  messageSchema,
};
