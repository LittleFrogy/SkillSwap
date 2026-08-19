const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Endorsement = require('../models/Endorsement');
const Listing = require('../models/Listing');
const Session = require('../models/Session');
const User = require('../models/User');
const { canCreateEndorsement, summarizeEndorsement } = require('../utils/endorsementLogic');

const isConnected = () => mongoose.connection.readyState === 1;

router.get('/sessions', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid User ID required' });
    }

    // Fetch actual completed sessions (or sessions in the past)
    const sessions = await Session.find({
      $or: [{ teacherId: userId }, { learnerId: userId }],
      $or: [{ status: 'completed' }, { scheduledTime: { $lt: new Date() } }]
    })
    .populate('teacherId', 'fullName')
    .populate('learnerId', 'fullName')
    .sort({ scheduledTime: -1 });

    const formattedSessions = sessions.map((session) => {
      // Determine who the partner is
      const isTeacher = session.teacherId._id.toString() === userId;
      const partner = isTeacher ? session.learnerId : session.teacherId;
      
      return {
        _id: session._id,
        sessionId: session._id,
        skill: session.skill,
        completedAt: session.scheduledTime, // Use scheduledTime as completedAt for now
        partnerUserId: partner ? partner._id : null,
        partnerName: partner ? partner.fullName : 'Unknown partner',
        status: session.status,
        role: isTeacher ? 'teacher' : 'learner'
      };
    });

    res.json(formattedSessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid User ID required' });
    }

    let endorsements = await Endorsement.find({ toUserId: userId }).sort({ createdAt: -1 });
    res.json(endorsements.map((item) => summarizeEndorsement(item)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fromUserId, toUserId, sessionId, skill, comment } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(fromUserId)) {
      return res.status(400).json({ message: 'Invalid ID formats' });
    }

    const session = await Session.findById(sessionId);
    const isPast = new Date(session?.scheduledTime) < new Date();
    if (!session || (session.status !== 'completed' && !isPast)) {
      return res.status(400).json({ message: 'Valid completed (or past) session required to endorse.' });
    }

    const existingEndorsement = await Endorsement.findOne({ sessionId, fromUserId });
    if (existingEndorsement) {
      return res.status(400).json({ message: 'You can only endorse a completed session once.' });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    const endorsementData = {
      fromUserId,
      fromUserName: fromUser ? fromUser.fullName : 'Anonymous',
      toUserId,
      toUserName: toUser ? toUser.fullName : 'Unknown',
      sessionId,
      skill,
      comment,
      visible: true
    };

    const endorsement = new Endorsement(endorsementData);
    const saved = await endorsement.save();

    const listing = await Listing.findOne({ userId: toUserId, skill });
    if (listing) {
      listing.endorsements = listing.endorsements || [];
      listing.endorsements.push({
        fromUserId: saved.fromUserId,
        fromUserName: saved.fromUserName,
        comment: saved.comment,
        skill: saved.skill,
        visible: saved.visible,
        createdAt: saved.createdAt
      });
      await listing.save();
    }

    return res.status(201).json(summarizeEndorsement(saved));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/visibility', async (req, res) => {
  try {
    const { visible } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid endorsement ID' });
    }

    const endorsement = await Endorsement.findById(req.params.id);
    if (!endorsement) return res.status(404).json({ message: 'Endorsement not found' });
    
    endorsement.visible = visible;
    await endorsement.save();
    
    return res.json(summarizeEndorsement(endorsement));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
