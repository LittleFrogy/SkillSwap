const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  googleEventId: {
    type: String,
    default: null
  },
  videoRoomUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
