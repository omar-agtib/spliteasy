const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { registerSchema, loginSchema } = require("../validation/schemas");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, phone, password, language } = value;

    if (email && await User.findOne({ email })) return res.status(409).json({ message: "Email already used" });
    if (phone && await User.findOne({ phone })) return res.status(409).json({ message: "Phone already used" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed, language });

    const token = signToken(user._id);
    res.json({ token, user: { _id:user._id, name:user.name, email:user.email, phone:user.phone, language:user.language } });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { email, phone, password } = value;
    const user = await User.findOne(email ? { email } : { phone });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: { _id:user._id, name:user.name, email:user.email, phone:user.phone, language:user.language } });
  } catch (e) { next(e); }
});

module.exports = router;
