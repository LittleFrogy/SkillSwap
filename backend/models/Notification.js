const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    type: { type: String, enum: ['reaction'], default: 'reaction' },
    reactionType: { type: String, enum: ['like', 'helpful', 'insightful'], required: true },
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentSnippet: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
