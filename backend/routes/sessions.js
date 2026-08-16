const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const axios = require('axios');

// POST /api/sessions/schedule
// Schedules a session, generates a Daily.co video room, and (optionally) a Google Calendar event
router.post('/schedule', async (req, res) => {
  try {
    const { teacherId, learnerId, skill, scheduledTime, notes } = req.body;

    if (!teacherId || !learnerId || !skill || !scheduledTime) {
      return res.status(400).json({ message: 'Missing required fields for scheduling.' });
    }

    // 1. Generate Daily.co Video Room
    let videoRoomUrl = null;
    try {
      // NOTE: You will need to add DAILY_API_KEY to your .env file
      const dailyApiKey = process.env.DAILY_API_KEY;
      if (dailyApiKey) {
        const dailyRes = await axios.post(
          'https://api.daily.co/v1/rooms',
          {
            properties: {
              exp: Math.floor(new Date(scheduledTime).getTime() / 1000) + 86400, // Expires 24 hours after scheduled time
              enable_screenshare: true,
              enable_chat: true,
            }
          },
          {
            headers: {
              Authorization: `Bearer ${dailyApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        videoRoomUrl = dailyRes.data.url;
      } else {
        console.warn('DAILY_API_KEY not found in .env. Video room generation skipped.');
        // Fallback for development
        videoRoomUrl = `https://your-domain.daily.co/mock-room-${Date.now()}`;
      }
    } catch (dailyError) {
      console.error('Error creating Daily room:', dailyError.response?.data || dailyError.message);
      return res.status(500).json({ message: 'Failed to create video room.' });
    }

    // 2. TODO: Google Calendar Integration
    // We will build this out in the next step using a Service Account or OAuth

    // 3. Save Session to Database
    const newSession = new Session({
      teacherId,
      learnerId,
      skill,
      scheduledTime,
      notes,
      videoRoomUrl
    });

    await newSession.save();

    res.status(201).json({
      message: 'Session scheduled successfully!',
      session: newSession
    });

  } catch (error) {
    console.error('Error scheduling session:', error);
    res.status(500).json({ message: 'Internal server error while scheduling session.' });
  }
});

// GET /api/sessions/user/:userId
// Fetch all sessions for a specific user (either as teacher or learner)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fallback for demo users without a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.json([]); 
    }

    const sessions = await Session.find({
      $or: [{ teacherId: userId }, { learnerId: userId }]
    })
    .populate('teacherId', 'fullName username profilePicture')
    .populate('learnerId', 'fullName username profilePicture')
    .sort({ scheduledTime: 1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions.' });
  }
});

// GET /api/sessions/:sessionId
// Fetch a specific session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findById(sessionId)
      .populate('teacherId', 'fullName username profilePicture')
      .populate('learnerId', 'fullName username profilePicture');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Failed to fetch session details.' });
  }
});

module.exports = router;
