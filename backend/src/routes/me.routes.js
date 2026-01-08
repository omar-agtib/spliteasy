const router = require("express").Router();
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const u = req.user;
  res.json({ user: { _id:u._id, name:u.name, email:u.email, phone:u.phone, language:u.language, pushToken:u.pushToken } });
});

router.put("/language", auth, async (req, res) => {
  const { language } = req.body;
  if (!["en","fr","ar","darija"].includes(language)) return res.status(400).json({ message:"Invalid language" });
  req.user.language = language;
  await req.user.save();
  res.json({ ok:true });
});

router.put("/push-token", auth, async (req, res) => {
  req.user.pushToken = req.body.pushToken || "";
  await req.user.save();
  res.json({ ok:true });
});

module.exports = router;
