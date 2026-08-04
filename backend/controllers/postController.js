const Post = require("../models/post");

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    // Image uploaded by Multer
    const image = req.file ? `uploads/${req.file.filename}` : "";

    const newPost = new Post({
      content,
      image,
    });

    const savedPost = await newPost.save();

    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};