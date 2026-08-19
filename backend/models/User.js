const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    default: ''
  },
  tagline: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  skillCredits: {
    type: Number,
    default: 5
  },
  badges: {
    type: [
      {
        id: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  preferredLanguage: {
    type: String,
    default: "en"
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
