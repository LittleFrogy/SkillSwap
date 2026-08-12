const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a comment
exports.createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    const newComment = new Comment({
      postId,
      content,
      parentCommentId: parentCommentId || null,
    });

    const savedComment = await newComment.save();

    // Increment post's comment count
    const post = await Post.findById(postId);
    if (post) {
      post.comments = (post.comments || 0) + 1;
      await post.save();
    }

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// React to a comment
exports.reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, username = "Rebecca Hughes" } = req.body; // 'like', 'helpful', 'insightful'

    const validReactions = ['like', 'helpful', 'insightful'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.reactions) {
      comment.reactions = { like: [], helpful: [], insightful: [] };
    }

    // Convert old number-based reactions to arrays if necessary
    validReactions.forEach(type => {
      if (typeof comment.reactions[type] === 'number') {
        comment.reactions[type] = [];
      }
    });

    // Remove user from all other reactions
    validReactions.forEach(type => {
      if (type !== reactionType) {
        comment.reactions[type] = comment.reactions[type].filter(user => user !== username);
      }
    });

    // Toggle the selected reaction
    const hasReacted = comment.reactions[reactionType].includes(username);
    if (hasReacted) {
      // Remove it
      comment.reactions[reactionType] = comment.reactions[reactionType].filter(user => user !== username);
    } else {
      // Add it
      comment.reactions[reactionType].push(username);
    }

    await comment.save();

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
