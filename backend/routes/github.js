const express = require('express');
const router = express.Router();
const axios = require('axios');
const SavedIssue = require('../models/SavedIssue');

// ── GET /api/github/issues?skill=react&page=1 ────────────────────────────────
// Searches GitHub for open issues labelled "good first issue" related to a skill
router.get('/issues', async (req, res) => {
  try {
    const { skill, page = 1 } = req.query;

    if (!skill || !skill.trim()) {
      return res.status(400).json({ message: 'skill query parameter is required.' });
    }

    const cleanSkill = skill.trim().toLowerCase();

    // Build GitHub search query
    // Search for open issues with "good first issue" label that mention the skill
    const q = `label:"good first issue" state:open ${cleanSkill} in:title,body`;

    const headers = { Accept: 'application/vnd.github+json' };
    // Optional: use a GitHub token for higher rate limits (5000/hr vs 10/min)
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get('https://api.github.com/search/issues', {
      params: {
        q,
        sort: 'created',
        order: 'desc',
        per_page: 20,
        page: Number(page)
      },
      headers,
      timeout: 15000
    });

    const issues = response.data.items.map(issue => ({
      id:           issue.id,
      number:       issue.number,
      title:        issue.title,
      htmlUrl:      issue.html_url,
      repoFullName: issue.repository_url.replace('https://api.github.com/repos/', ''),
      labels:       issue.labels.map(l => l.name),
      state:        issue.state,
      comments:     issue.comments,
      createdAt:    issue.created_at,
      updatedAt:    issue.updated_at,
      body:         issue.body ? issue.body.substring(0, 300) : ''
    }));

    return res.json({
      totalCount: response.data.total_count,
      page:       Number(page),
      perPage:    20,
      issues
    });

  } catch (err) {
    console.error('GitHub search error:', err.response?.data?.message || err.message);

    if (err.response?.status === 403) {
      return res.status(429).json({
        message: 'GitHub API rate limit reached. Try again in a minute, or add a GITHUB_TOKEN to your .env for higher limits.'
      });
    }

    return res.status(500).json({ message: 'Failed to search GitHub issues: ' + (err.response?.data?.message || err.message) });
  }
});

// ── POST /api/github/save ─────────────────────────────────────────────────────
// Save a GitHub issue for the user
router.post('/save', async (req, res) => {
  try {
    const { userId, issue } = req.body;

    if (!userId || !issue || !issue.id) {
      return res.status(400).json({ message: 'userId and issue (with id) are required.' });
    }

    const saved = await SavedIssue.findOneAndUpdate(
      { userId: String(userId), issueId: issue.id },
      {
        userId:       String(userId),
        issueId:      issue.id,
        title:        issue.title,
        htmlUrl:      issue.htmlUrl,
        repoFullName: issue.repoFullName || '',
        labels:       issue.labels || [],
        language:     issue.language || '',
        createdAt:    issue.createdAt,
        savedAt:      new Date()
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ message: 'Issue saved.', savedIssue: saved });

  } catch (err) {
    console.error('Save issue error:', err.message);
    return res.status(500).json({ message: 'Failed to save issue: ' + err.message });
  }
});

// ── GET /api/github/saved/:userId ─────────────────────────────────────────────
// Get all saved issues for a user
router.get('/saved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const issues = await SavedIssue.find({ userId: String(userId) }).sort({ savedAt: -1 });
    return res.json({ issues });
  } catch (err) {
    console.error('Get saved issues error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch saved issues.' });
  }
});

// ── DELETE /api/github/saved/:userId/:issueId ─────────────────────────────────
// Remove a saved issue
router.delete('/saved/:userId/:issueId', async (req, res) => {
  try {
    const { userId, issueId } = req.params;
    await SavedIssue.findOneAndDelete({ userId: String(userId), issueId: Number(issueId) });
    return res.json({ message: 'Issue removed from saved.' });
  } catch (err) {
    console.error('Delete saved issue error:', err.message);
    return res.status(500).json({ message: 'Failed to remove saved issue.' });
  }
});

module.exports = router;
