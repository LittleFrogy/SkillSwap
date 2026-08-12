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

// React to a post
exports.reactToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, username = "Rebecca Hughes" } = req.body; // 'like', 'helpful', 'insightful'

    const validReactions = ['like', 'helpful', 'insightful'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Initialize if undefined (for old posts)
    if (!post.reactions) {
      post.reactions = { like: [], helpful: [], insightful: [] };
    }

    // Convert old number-based reactions to arrays if necessary (migration for existing data)
    validReactions.forEach(type => {
      if (typeof post.reactions[type] === 'number') {
        post.reactions[type] = [];
      }
    });

    // Remove user from all other reactions
    validReactions.forEach(type => {
      if (type !== reactionType) {
        post.reactions[type] = post.reactions[type].filter(user => user !== username);
      }
    });

    // Toggle the selected reaction
    const hasReacted = post.reactions[reactionType].includes(username);
    if (hasReacted) {
      // Remove it
      post.reactions[reactionType] = post.reactions[reactionType].filter(user => user !== username);
    } else {
      // Add it
      post.reactions[reactionType].push(username);
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};