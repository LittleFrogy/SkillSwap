const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null, // null means top-level comment
  },
  content: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    default: "Rebecca Hughes", // Hardcoded based on current state
  },
  authorRole: {
    type: String,
    default: "Guitarist",
  },
  reactions: {
    like: [{ type: String }],
    helpful: [{ type: String }],
    insightful: [{ type: String }],
  },
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
