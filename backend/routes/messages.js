const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const router = express.Router();

// Create a message
router.post("/", async (request, response) => {
  try {
    const { senderId, receiverId, text } = request.body;

    if (!senderId || !receiverId || !text?.trim()) {
      return response.status(400).json({
        message: "Sender ID, receiver ID, and text are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return response.status(400).json({
        message: "Invalid sender or receiver ID.",
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text.trim(),
    });

    response.status(201).json(newMessage);
  } catch (error) {
    response.status(500).json({
      message: "Failed to save message.",
      error: error.message,
    });
  }
});

// Read messages between two users
router.get("/conversation/:userId/:otherUserId", async (request, response) => {
  try {
    const { userId, otherUserId } = request.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(otherUserId)
    ) {
      return response.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const savedMessages = await Message.find({
      $or: [
        {
          senderId: userId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: userId,
        },
      ],
    }).sort({ createdAt: 1 });

    response.json(savedMessages);
  } catch (error) {
    response.status(500).json({
      message: "Failed to load messages.",
      error: error.message,
    });
  }
});

// Update a message
router.put("/:id", async (request, response) => {
  try {
    const { text, currentUserId } = request.body;

    if (!text?.trim() || !currentUserId) {
      return response.status(400).json({
        message: "Message text and current user ID are required.",
      });
    }

    const message = await Message.findById(request.params.id);

    if (!message) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    if (message.senderId.toString() !== currentUserId) {
      return response.status(403).json({
        message: "You can only edit your own messages.",
      });
    }

    message.text = text.trim();
    await message.save();

    response.json(message);
  } catch (error) {
    response.status(500).json({
      message: "Failed to update message.",
      error: error.message,
    });
  }
});

// Delete a message
router.delete("/:id", async (request, response) => {
  try {
    const { currentUserId } = request.body;

    if (!currentUserId) {
      return response.status(400).json({
        message: "Current user ID is required.",
      });
    }

    const message = await Message.findById(request.params.id);

    if (!message) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    if (message.senderId.toString() !== currentUserId) {
      return response.status(403).json({
        message: "You can only delete your own messages.",
      });
    }

    await Message.findByIdAndDelete(request.params.id);

    response.json({
      message: "Message deleted successfully.",
    });
  } catch (error) {
    response.status(500).json({
      message: "Failed to delete message.",
      error: error.message,
    });
  }
});

module.exports = router;
