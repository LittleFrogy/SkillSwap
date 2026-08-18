const Post = require('../models/Post');
const Notification = require('../models/Notification');

const VALID_REACTIONS = ['like', 'helpful', 'insightful'];

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content, image, authorName, authorRole } = req.body;

    const newPost = new Post({
      authorName: authorName || 'Rebecca Hughes',
      authorRole: authorRole || 'Guitarist',
      content,
      image: image || '',
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// React to a post  (PUT /api/posts/:id/react)
exports.reactToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, username = 'Rebecca Hughes' } = req.body;

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.reactions) post.reactions = { like: [], helpful: [], insightful: [] };
    VALID_REACTIONS.forEach(type => {
      if (typeof post.reactions[type] === 'number') post.reactions[type] = [];
    });

    VALID_REACTIONS.forEach(type => {
      if (type !== reactionType) {
        post.reactions[type] = post.reactions[type].filter(u => u !== username);
      }
    });

    const alreadyReacted = post.reactions[reactionType].includes(username);
    if (alreadyReacted) {
      post.reactions[reactionType] = post.reactions[reactionType].filter(u => u !== username);
    } else {
      post.reactions[reactionType].push(username);

      if (username !== post.authorName) {

        await Notification.findOneAndUpdate(
          {
            recipientName: post.authorName,
            actorName: username,
            targetType: 'post',
            targetId: post._id,
            read: false,
          },
          {
            reactionType,
            contentSnippet: (post.content || '').slice(0, 80),
            read: false,
          },
          { upsert: true, new: true }
        );
      }
    }

    post.markModified('reactions');
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};