require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);

// Start Server
async function startServer() {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("MongoDB ERROR:");
    console.error(err);
  }
}

startServer();