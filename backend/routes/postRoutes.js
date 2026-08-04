const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  getPosts,
  createPost,
} = require("../controllers/postController");

// Get all posts
router.get("/", getPosts);

// Create a post with optional image upload
router.post("/", upload.single("image"), createPost);

module.exports = router;