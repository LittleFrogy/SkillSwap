const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  getPosts,
  createPost,
  reactToPost,
} = require("../controllers/postController");

// Get all posts
router.get("/", getPosts);

// Create a post with optional image upload
router.post("/", upload.single("image"), createPost);

// React to a post
router.put("/:id/react", reactToPost);

module.exports = router;