const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Initialize Google Calendar API if service account JSON exists
const keyPath = path.join(__dirname, '../google-service-account.json');
let calendar = null;

try {
  if (fs.existsSync(keyPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    calendar = google.calendar({ version: 'v3', auth });
    console.log("✅ Google Calendar API initialized");
  } else {
    console.warn("⚠️ google-service-account.json not found. Calendar invites skipped.");
  }
} catch (err) {
  console.error("Failed to initialize Google Calendar API:", err.message);
}

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

    // 2. Google Calendar Integration
    let googleEventId = null;
    
    if (calendar) {
      try {
        const teacherUser = await User.findById(teacherId);
        const learnerUser = await User.findById(learnerId);

        if (teacherUser && learnerUser) {
          const startTime = new Date(scheduledTime);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

          const event = {
            summary: `SkillSwap Session: ${skill}`,
            location: videoRoomUrl || 'Virtual Room on SkillSwap',
            description: `**SkillSwap Virtual Session**\n\n**Topic:** ${skill}\n**Notes:** ${notes || 'No specific agenda provided.'}\n\n**Join Video Room:** ${videoRoomUrl || 'Link will be available in your dashboard.'}`,
            start: {
              dateTime: startTime.toISOString(),
              timeZone: 'UTC', // Using UTC, Google automatically converts to the user's timezone in their calendar UI
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'UTC',
            },
            attendees: [
              { email: teacherUser.email },
              { email: learnerUser.email }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 15 },
              ],
            },
          };

          const calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all' // Sends the email invitation to users
          });

          googleEventId = calendarResponse.data.id;
        }
      } catch (calError) {
        console.error('Error creating Google Calendar event:', calError.message);
        // We won't block the session creation if calendar fails
      }
    }

    // 3. Save Session to Database
    const newSession = new Session({
      teacherId,
      learnerId,
      skill,
      scheduledTime,
      notes,
      videoRoomUrl,
      googleEventId
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
