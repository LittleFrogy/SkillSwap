const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['grant', 'earned', 'spent'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  partnerUserId: {
    type: String,
    default: null
  },
  partnerName: {
    type: String,
    default: ''
  },
  skill: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: null
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
