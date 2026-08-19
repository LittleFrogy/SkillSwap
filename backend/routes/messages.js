const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const router = express.Router();

// Get unread message count from one sender to one receiver
router.get("/unread/:senderId/:receiverId", async (request, response) => {
  try {
    const { senderId, receiverId } = request.params;

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return response.status(400).json({
        message: "Invalid sender or receiver ID.",
      });
    }

    const unreadCount = await Message.countDocuments({
      senderId,
      receiverId,
      isRead: false,
    });

    response.json({
      unreadCount,
    });
  } catch (error) {
    response.status(500).json({
      message: "Failed to load unread count.",
      error: error.message,
    });
  }
});

module.exports = router;

// Mark messages as read
router.patch("/read/:senderId/:receiverId", async (request, response) => {
  try {
    const { senderId, receiverId } = request.params;

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return response.status(400).json({
        message: "Invalid sender or receiver ID.",
      });
    }

    await Message.updateMany(
      {
        senderId,
        receiverId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    const io = request.app.get("io");

    if (io) {
      io.to(senderId).emit("messagesRead", {
        readerId: receiverId,
      });
    }

    response.json({
      message: "Messages marked as read.",
    });
  } catch (error) {
    response.status(500).json({
      message: "Failed to mark messages as read.",
      error: error.message,
    });
  }
});

// Create a message
router.post("/", async (request, response) => {
  try {
    const { senderId, receiverId, text = "", attachment = null } = request.body;

    const hasText = text.trim().length > 0;
    const hasAttachment = Boolean(attachment?.data);

    if (!senderId || !receiverId || (!hasText && !hasAttachment)) {
      return response.status(400).json({
        message: "Sender ID, receiver ID, and message text or attachment are required.",
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

    if (hasAttachment) {
      const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".txt",

        ".jpg",
        ".jpeg",
        ".png",
        ".webp",

        ".mp3",
        ".wav",
        ".m4a",
        ".ogg",
        ".webm",

      ];
      const fileName = (attachment.name || "").toLowerCase();

      const isAllowedFile = allowedExtensions.some((extension) =>
        fileName.endsWith(extension)
      );

      if (!isAllowedFile) {
        return response.status(400).json({
          message:
            "File type not allowed. Only documents, images, and audio files are accepted.",
        });
      }

      const base64Data = attachment.data.split(",")[1];

      if (!base64Data) {
        return response.status(400).json({
          message: "Invalid attachment data.",
        });
      }

      const fileSizeInBytes = Buffer.byteLength(base64Data, "base64");
      const maxFileSize = 5 * 1024 * 1024;

      if (fileSizeInBytes > maxFileSize) {
        return response.status(400).json({
          message: "Attachment is too large. Maximum allowed size is 5 MB.",
        });
      }
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text.trim(),
      attachment: hasAttachment
        ? {
            name: attachment.name || "attachment",
            type: attachment.type || "application/octet-stream",
            data: attachment.data,
          }
        : undefined,
    });

    // Send the new message instantly to the receiver
    const io = request.app.get("io");

    if (io) {
      io.to(receiverId).emit("receiveMessage", newMessage);
    }

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
