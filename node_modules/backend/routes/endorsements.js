const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Endorsement = require('../models/Endorsement');
const Listing = require('../models/Listing');
const { canCreateEndorsement, summarizeEndorsement } = require('../utils/endorsementLogic');

const isConnected = () => mongoose.connection.readyState === 1;

let mockSessions = [
  {
    _id: 'session_1',
    status: 'completed',
    skill: 'Python Programming',
    completedAt: '2026-07-30T10:00:00.000Z',
    participants: [
      { userId: 'demo-user', name: 'Alicia Chen' },
      { userId: 'user_2', name: 'Bob Martin' }
    ]
  },
  {
    _id: 'session_2',
    status: 'completed',
    skill: 'UI/UX Design',
    completedAt: '2026-08-01T14:30:00.000Z',
    participants: [
      { userId: 'demo-user', name: 'Alicia Chen' },
      { userId: 'user_3', name: 'Mina Patel' }
    ]
  }
];

let mockEndorsements = [];
let mockIdCounter = 1;

const getUserName = (userId) => {
  if (userId === 'demo-user') return 'Alicia Chen';
  if (userId === 'user_2') return 'Bob Martin';
  if (userId === 'user_3') return 'Mina Patel';
  return 'Anonymous';
};

router.get('/sessions', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    const sessions = mockSessions
      .filter((session) => session.participants.some((participant) => participant.userId === userId))
      .map((session) => {
        const participant = session.participants.find((entry) => entry.userId !== userId);
        return {
          _id: session._id,
          sessionId: session._id,
          skill: session.skill,
          completedAt: session.completedAt,
          partnerUserId: participant ? participant.userId : null,
          partnerName: participant ? participant.name : 'Unknown partner',
          status: session.status
        };
      });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    if (isConnected()) {
      const endorsements = await Endorsement.find({ toUserId: userId }).sort({ createdAt: -1 });
      res.json(endorsements.map((item) => summarizeEndorsement(item)));
    } else {
      const endorsements = mockEndorsements.filter((item) => item.toUserId === userId).map((item) => summarizeEndorsement(item));
      res.json(endorsements);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fromUserId, toUserId, sessionId, skill, comment } = req.body;
    const session = mockSessions.find((item) => item._id === sessionId);

    const existingEndorsements = isConnected()
      ? await Endorsement.find({ sessionId, fromUserId })
      : mockEndorsements.filter((item) => item.sessionId === sessionId && item.fromUserId === fromUserId);

    if (!canCreateEndorsement(session, fromUserId, toUserId, existingEndorsements, sessionId)) {
      return res.status(400).json({ message: 'You can only endorse a completed session once.' });
    }

    const endorsementData = {
      fromUserId,
      fromUserName: getUserName(fromUserId),
      toUserId,
      toUserName: getUserName(toUserId),
      sessionId,
      skill,
      comment,
      visible: true
    };

    if (isConnected()) {
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
    }

    const endorsement = {
      _id: `mock_endorsement_${mockIdCounter++}`,
      ...endorsementData,
      createdAt: new Date().toISOString(),
      visible: true
    };
    mockEndorsements.push(endorsement);
    return res.status(201).json(summarizeEndorsement(endorsement));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/visibility', async (req, res) => {
  try {
    const { visible } = req.body;
    if (isConnected()) {
      const endorsement = await Endorsement.findById(req.params.id);
      if (!endorsement) return res.status(404).json({ message: 'Endorsement not found' });
      endorsement.visible = visible;
      await endorsement.save();
      return res.json(summarizeEndorsement(endorsement));
    }

    const endorsement = mockEndorsements.find((item) => item._id === req.params.id);
    if (!endorsement) return res.status(404).json({ message: 'Endorsement not found' });
    endorsement.visible = visible;
    return res.json(summarizeEndorsement(endorsement));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
