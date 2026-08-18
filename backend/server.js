const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

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
const notificationRoutes = require("./routes/notifications");

const { startSessionReminderScheduler } = require("./utils/sessionReminderScheduler");
const { startWeeklyDigestScheduler } = require("./utils/weeklyDigestScheduler");

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});


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
app.use("/api/notifications", notificationRoutes);

// Connect to the shared MongoDB database
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");

      // Start background schedulers after DB is ready
      startSessionReminderScheduler();
      startWeeklyDigestScheduler();
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
    });
} else {
  console.warn("MONGO_URI is not defined.");
}

// Test route
app.get("/", (request, response) => {
  response.send("SkillSwap API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
