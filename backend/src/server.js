require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const { initSocket } = require("./socket");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const meRoutes = require("./routes/me.routes");
const roomRoutes = require("./routes/room.routes");
const expenseRoutes = require("./routes/expense.routes");
const messageRoutes = require("./routes/message.routes");

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : true,
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// serve uploaded receipts
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/messages", messageRoutes);

app.use(errorHandler);

initSocket(server);

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");

  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`✅ API running on :${port}`));
})();
