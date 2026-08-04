const express = require("express");
const router = express.Router();

const {
  getPosts,
  createPost,
} = require("../controllers/postController");

// Get all posts
router.get("/", getPosts);

// Create a post with optional image upload
router.post("/", createPost);

module.exports = router;