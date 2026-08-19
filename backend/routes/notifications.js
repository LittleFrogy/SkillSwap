const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { sendWeeklyDigest } = require('../utils/notificationService');
const Notification = require('../models/Notification');

router.post('/trigger-weekly-digest', async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error('ADMIN_SECRET is not set — refusing to run the manual digest trigger.');
    return res.status(503).json({
      message: 'This endpoint is disabled: ADMIN_SECRET is not configured on the server.'
    });
  }

  const providedSecret = req.headers['x-admin-secret'] || '';
  const isMatch =
    providedSecret.length === adminSecret.length &&
    crypto.timingSafeEqual(Buffer.from(providedSecret), Buffer.from(adminSecret));

  if (!isMatch) {
    return res.status(403).json({ message: 'Forbidden — invalid admin secret.' });
  }

  res.json({ message: 'Weekly digest job started in background. Check server logs.' });
  sendWeeklyDigest().catch(err =>
    console.error('Manual digest trigger error:', err.message)
  );
});

// Returns the 30 most recent notifications for this user, newest first.
router.get('/inbox/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ message: 'username is required' });

    const notifications = await Notification.find({ recipientName: username })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a single notification as read.
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark every unread notification for a user as read in one shot.
router.put('/mark-all-read/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await Notification.updateMany(
      { recipientName: username, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
