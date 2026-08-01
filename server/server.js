const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Message = require("./models/Message");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })

  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
  });

// Home routes
app.get("/", (request, response) => {
  response.send("SkillSwap backend is running!");
});

app.post("/api/messages", async (request, response) => {

  try {
    const { sender, receiver, text } = request.body;

    if (!sender || !receiver || !text) {
      return response.status(400).json({
        message: "Sender, receiver, and text are required.",
      });
    }


    const newMessage = await Message.create({
      sender,
      receiver,
      text,
    });

    response.status(201).json(newMessage);

  } catch (error) {
    response.status(500).json({
      message: "Failed to save message.",
      error: error.message,
    });
  }
});

//Read message from one conversation
app.get("/api/messages/:receiver", async (request, response) => {
  try {
    const receiverName = request.params.receiver;

    const savedMessages = await Message.find({
      receiver: receiverName,
    }).sort({ createdAt: 1 });

    response.json(savedMessages);
  } catch (error) {
    response.status(500).json({
      message: "Failed to load messages.",
      error: error.message,
    });
  }
});

app.delete("/api/messages/:id", async (request, response) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(
      request.params.id
    );

    if (!deletedMessage) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    response.json({
      message: "Message deleted successfully.",
      deletedMessage,
    });
  } catch (error) {
    response.status(500).json({
      message: "Failed to delete message.",
      error: error.message,
    });
  }
});

//update a message
app.put("/api/messages/:id", async (request, response) => {
  try {
    const { text } = request.body;

    if (!text || text.trim() === "") {
      return response.status(400).json({
        message: "Message text is required.",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      request.params.id,
      {
        text: text.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedMessage) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    response.json(updatedMessage);
  } catch (error) {
    response.status(500).json({
      message: "Failed to update message.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
