const express = require("express");
const router = express.Router();



const {
  getPosts,
  createPost,
  reactToPost,
} = require("../controllers/postController");

// Get all posts
router.get("/", getPosts);

router.post("/", createPost);

// React to a post
router.put("/:id/react", reactToPost);

module.exports = router;