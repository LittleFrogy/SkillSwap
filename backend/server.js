const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const messageRoutes = require("./routes/messages");
const listingRoutes = require("./routes/listings");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const endorsementRoutes = require("./routes/endorsements");
const postRoutes = require("./routes/postRoutes");
const matchRoutes = require("./routes/matches");
const creditRoutes = require("./routes/credits");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api/messages", messageRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/endorsements", endorsementRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/credits", creditRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
