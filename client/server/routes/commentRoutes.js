const express = require("express");
const router = express.Router();

const {
  getComments,
  createComment,
  reactToComment,
} = require("../controllers/commentController");

// Get comments for a post
router.get("/:postId", getComments);

// Create a comment
router.post("/", createComment);

// React to a comment
router.put("/:id/react", reactToComment);

module.exports = router;
