const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId).select("_id name language");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => socket.join(String(roomId)));
    socket.on("leave_room", (roomId) => socket.leave(String(roomId)));
    socket.on("disconnect", () => {});
  });

  console.log("✅ Socket.io ready");
}

function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(String(roomId)).emit(event, payload);
}

module.exports = { initSocket, emitToRoom };
