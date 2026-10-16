const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Dynamically reflect request origin so credentials work across Vercel, localhost, and custom domains
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

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

const path = require("path");
const fs = require("fs");

const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
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

  socket.on(
    "join-consultation",
    ({ appointmentId, user }) => {
      const roomId =
        `consultation-${appointmentId}`;

      socket.join(roomId);

      console.log(
        `${user?.name || "User"} joined ${roomId}`
      );

      // Notify other participant
      socket.to(roomId).emit(
        "participant-joined",
        {
          socketId: socket.id,
          user,
        }
      );

      // Get participant count
      const room =
        io.sockets.adapter.rooms.get(roomId);

      const participantCount =
        room ? room.size : 1;

      io.to(roomId).emit(
        "room-status",
        {
          participantCount,
        }
      );
    }
  );

  // ======================================
  // WEBRTC OFFER
  // ======================================

  socket.on(
    "webrtc-offer",
    ({ appointmentId, offer }) => {
      const roomId =
        `consultation-${appointmentId}`;

      socket.to(roomId).emit(
        "webrtc-offer",
        {
          offer,
          senderId: socket.id,
        }
      );
    }
  );

  // ======================================
  // WEBRTC ANSWER
  // ======================================

  socket.on(
    "webrtc-answer",
    ({ appointmentId, answer }) => {
      const roomId =
        `consultation-${appointmentId}`;

      socket.to(roomId).emit(
        "webrtc-answer",
        {
          answer,
          senderId: socket.id,
        }
      );
    }
  );

  // ======================================
  // ICE CANDIDATE
  // ======================================

  socket.on(
    "ice-candidate",
    ({ appointmentId, candidate }) => {
      const roomId =
        `consultation-${appointmentId}`;

      socket.to(roomId).emit(
        "ice-candidate",
        {
          candidate,
          senderId: socket.id,
        }
      );
    }
  );

  // ======================================
  // CONSULTATION CHAT
  // ======================================

  socket.on(
    "consultation-message",
    ({ appointmentId, message, user }) => {
      const roomId =
        `consultation-${appointmentId}`;

      io.to(roomId).emit(
        "consultation-message",
        {
          message,
          user,
          timestamp: new Date().toISOString(),
        }
      );
    }
  );

  // ======================================
  // LEAVE CONSULTATION
  // ======================================

  socket.on(
    "leave-consultation",
    ({ appointmentId }) => {
      const roomId =
        `consultation-${appointmentId}`;

      socket.leave(roomId);

      socket.to(roomId).emit(
        "participant-left",
        {
          socketId: socket.id,
        }
      );

      const room =
        io.sockets.adapter.rooms.get(roomId);

      const participantCount =
        room ? room.size : 0;

      io.to(roomId).emit(
        "room-status",
        {
          participantCount,
        }
      );
    }
  );

  // ======================================
  // DISCONNECT
  // ======================================

  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
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