const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  fromUserId: {
    type: String,
    required: true
  },
  fromUserName: {
    type: String,
    required: true,
    trim: true
  },
  toUserId: {
    type: String,
    required: true
  },
  toUserName: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    required: true
  },
  skill: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  visible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);
