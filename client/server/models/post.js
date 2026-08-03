const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorName: { type: String, default: "Rebecca Hughes" },
  authorRole: { type: String, default: "Guitarist" },
  content: { type: String, required: true },
  image: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);