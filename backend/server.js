const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const cors = require("cors");
require("dotenv").config();

const messageRoutes = require("./routes/messages");
const listingRoutes = require("./routes/listings");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const endorsementRoutes = require("./routes/endorsements");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const matchRoutes = require("./routes/matches");
const creditRoutes = require("./routes/credits");
const sessionRoutes = require("./routes/sessions");
const leaderboardRoutes = require("./routes/leaderboard");
const aiRoutes = require("./routes/ai");
const translateRoutes = require("./routes/translate");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinUser", (userId) => {
    socket.join(userId);

    onlineUsers.set(userId, socket.id);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", {
      senderId,
    });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("stopTyping", {
      senderId,
    });
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/messages", messageRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/endorsements", endorsementRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/translate", translateRoutes);

// Connect to the shared MongoDB database
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((error) => {
      console.error("❌ MongoDB connection failed:", error);
    });
} else {
  console.warn("⚠️ MONGO_URI is not defined.");
}

// Test route
app.get("/", (request, response) => {
  response.send("SkillSwap API is running");
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
