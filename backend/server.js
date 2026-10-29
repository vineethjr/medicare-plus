const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Dynamically reflect request origin so credentials work across Vercel, localhost, and custom domains
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ========================================
// DATABASE
// ========================================

require("./database");

// ========================================
// ROUTES
// ========================================

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const patientRoutes = require("./routes/patientRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/patient", patientRoutes);

const fs = require("fs");

const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "MediCare+ backend is running",
    });
  });
}

// ========================================
// CREATE HTTP SERVER
// ========================================

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ========================================
// SOCKET.IO CONNECTION
// ========================================

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ======================================
  // JOIN CONSULTATION
  // ======================================

  socket.on("join-consultation", ({ appointmentId, user }) => {
    const roomId = `consultation-${appointmentId}`;
    socket.join(roomId);

    console.log(`${user?.name || "User"} (${user?.role || "unknown"}) joined ${roomId}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    const participantCount = room ? room.size : 1;

    // Notify other participant that this user joined
    socket.to(roomId).emit("participant-joined", {
      socketId: socket.id,
      user,
      participantCount,
    });

    // Broadcast room status to everyone in the room
    io.to(roomId).emit("room-status", {
      participantCount,
      roomId,
    });

    // When 2 or more participants are in the room, signal ready for WebRTC negotiation
    if (participantCount >= 2) {
      io.to(roomId).emit("ready-for-call", {
        participantCount,
      });
    }
  });

  // ======================================
  // WEBRTC OFFER (supports both "webrtc-offer" and "offer")
  // ======================================

  const handleOffer = ({ appointmentId, offer }) => {
    const roomId = `consultation-${appointmentId}`;
    socket.to(roomId).emit("webrtc-offer", { offer, senderId: socket.id });
    socket.to(roomId).emit("offer", { offer, senderId: socket.id });
  };
  socket.on("webrtc-offer", handleOffer);
  socket.on("offer", handleOffer);

  // ======================================
  // WEBRTC ANSWER (supports both "webrtc-answer" and "answer")
  // ======================================

  const handleAnswer = ({ appointmentId, answer }) => {
    const roomId = `consultation-${appointmentId}`;
    socket.to(roomId).emit("webrtc-answer", { answer, senderId: socket.id });
    socket.to(roomId).emit("answer", { answer, senderId: socket.id });
  };
  socket.on("webrtc-answer", handleAnswer);
  socket.on("answer", handleAnswer);

  // ======================================
  // ICE CANDIDATE (supports both "ice-candidate" and "webrtc-ice-candidate")
  // ======================================

  const handleCandidate = ({ appointmentId, candidate }) => {
    const roomId = `consultation-${appointmentId}`;
    socket.to(roomId).emit("ice-candidate", { candidate, senderId: socket.id });
    socket.to(roomId).emit("webrtc-ice-candidate", { candidate, senderId: socket.id });
  };
  socket.on("ice-candidate", handleCandidate);
  socket.on("webrtc-ice-candidate", handleCandidate);

  // ======================================
  // CONSULTATION CHAT
  // ======================================

  socket.on("consultation-message", ({ appointmentId, message, user }) => {
    const roomId = `consultation-${appointmentId}`;
    io.to(roomId).emit("consultation-message", {
      message,
      user,
      timestamp: new Date().toISOString(),
    });
  });

  // ======================================
  // LEAVE CONSULTATION
  // ======================================

  const handleLeaveRoom = (appointmentId) => {
    const roomId = `consultation-${appointmentId}`;
    socket.leave(roomId);
    socket.to(roomId).emit("participant-left", { socketId: socket.id });

    const room = io.sockets.adapter.rooms.get(roomId);
    const participantCount = room ? room.size : 0;
    io.to(roomId).emit("room-status", { participantCount });
  };

  socket.on("leave-consultation", ({ appointmentId }) => {
    handleLeaveRoom(appointmentId);
  });

  // ======================================
  // DISCONNECT & DISCONNECTING
  // ======================================

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId.startsWith("consultation-")) {
        socket.to(roomId).emit("participant-left", { socketId: socket.id });
        const room = io.sockets.adapter.rooms.get(roomId);
        const participantCount = room ? Math.max(0, room.size - 1) : 0;
        io.to(roomId).emit("room-status", { participantCount });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ========================================
// START SERVER
// ========================================

server.listen(PORT, () => {
  console.log(
    `MediCare+ backend running on port ${PORT}`
  );

  console.log(
    "Socket.IO signaling server running"
  );
});