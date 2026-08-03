const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// Create a message
router.post("/", async (request, response) => {
  try {
    const { sender, receiver, text } = request.body;

    if (!sender || !receiver || !text?.trim()) {
      return response.status(400).json({
        message: "Sender, receiver, and text are required.",
      });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
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

// Read messages for one conversation
router.get("/:receiver", async (request, response) => {
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

// Update a message
router.put("/:id", async (request, response) => {
  try {
    const { text } = request.body;

    if (!text?.trim()) {
      return response.status(400).json({
        message: "Message text is required.",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      request.params.id,
      { text: text.trim() },
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

// Delete a message
router.delete("/:id", async (request, response) => {
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

module.exports = router;
