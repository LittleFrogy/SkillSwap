const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

const VALID_REACTIONS = ['like', 'helpful', 'insightful'];

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
    const { postId, content, parentCommentId, authorName, authorRole } = req.body;

    const newComment = new Comment({
      postId,
      content,
      parentCommentId: parentCommentId || null,
      authorName: authorName || 'Rebecca Hughes',
      authorRole: authorRole || 'Guitarist',
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

// React to a comment  (PUT /api/comments/:id/react)
exports.reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, username = 'Rebecca Hughes' } = req.body;

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.reactions) comment.reactions = { like: [], helpful: [], insightful: [] };
    VALID_REACTIONS.forEach(type => {
      if (typeof comment.reactions[type] === 'number') comment.reactions[type] = [];
    });

    VALID_REACTIONS.forEach(type => {
      if (type !== reactionType) {
        comment.reactions[type] = comment.reactions[type].filter(u => u !== username);
      }
    });

    const alreadyReacted = comment.reactions[reactionType].includes(username);
    if (alreadyReacted) {
      comment.reactions[reactionType] = comment.reactions[reactionType].filter(u => u !== username);
    } else {
      comment.reactions[reactionType].push(username);

      if (username !== comment.authorName) {

        const targetType = 'comment';

        await Notification.findOneAndUpdate(
          {
            recipientName: comment.authorName,
            actorName: username,
            targetType,
            targetId: comment._id,
            read: false,
          },
          {
            reactionType,
            contentSnippet: (comment.content || '').slice(0, 80),
            read: false,
          },
          { upsert: true, new: true }
        );
      }
    }

    comment.markModified('reactions');
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
