const mongoose = require('mongoose');

const savedIssueSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  issueId:      { type: Number, required: true },
  title:        { type: String, required: true },
  htmlUrl:      { type: String, required: true },
  repoFullName: { type: String, default: '' },
  labels:       { type: [String], default: [] },
  language:     { type: String, default: '' },
  createdAt:    { type: Date },
  savedAt:      { type: Date, default: Date.now }
});

savedIssueSchema.index({ userId: 1, issueId: 1 }, { unique: true });

module.exports = mongoose.model('SavedIssue', savedIssueSchema);
