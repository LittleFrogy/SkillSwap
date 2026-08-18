const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for smart matching.' });
    }

    //Fetch current user's listings to understand their needs/offerings
    const myListings = await Listing.find({ userId });

    const myLearnSkills = myListings.filter(l => l.type === 'learn').map(l => l.skill.toLowerCase());
    const myTeachSkills = myListings.filter(l => l.type === 'teach').map(l => l.skill.toLowerCase());

    //Fetch all OTHER users' listings
    const otherListings = await Listing.find({ userId: { $ne: userId } });

    const usersMap = {};
    otherListings.forEach(listing => {
      if (!usersMap[listing.userId]) {
        usersMap[listing.userId] = {
          userId: listing.userId,
          teaches: [],
          learns: [],
          availabilities: [],
          levels: []
        };
      }
      if (listing.type === 'teach') {
        usersMap[listing.userId].teaches.push(listing.skill.toLowerCase());
      } else if (listing.type === 'learn') {
        usersMap[listing.userId].learns.push(listing.skill.toLowerCase());
      }
      if (listing.weeklyAvailability && !usersMap[listing.userId].availabilities.includes(listing.weeklyAvailability)) {
        usersMap[listing.userId].availabilities.push(listing.weeklyAvailability);
      }
      if (listing.proficiencyLevel && !usersMap[listing.userId].levels.includes(listing.proficiencyLevel)) {
        usersMap[listing.userId].levels.push(listing.proficiencyLevel);
      }
    });

    const matches = [];

    //Calculate compatibility scores
    for (const otherUserId in usersMap) {
      const otherUser = usersMap[otherUserId];

      let score = 0;
      let matchedSkills = {
        theyCanTeachYou: [],
        youCanTeachThem: []
      };

      //Check if they teach what I want to learn
      otherUser.teaches.forEach(skill => {
        if (myLearnSkills.includes(skill)) {
          score += 40; // Base score for finding a teacher
          matchedSkills.theyCanTeachYou.push(skill);
        }
      });

      //Check if I teach what they want to learn
      otherUser.learns.forEach(skill => {
        if (myTeachSkills.includes(skill)) {
          score += 40; //Base score for finding a student
          matchedSkills.youCanTeachThem.push(skill);
        }
      });

      // Mutual Value Bonus
      if (matchedSkills.theyCanTeachYou.length > 0 && matchedSkills.youCanTeachThem.length > 0) {
        score += 20;
      }

      //Cap score at 100
      score = Math.min(score, 100);

      matches.push({
        userId: otherUser.userId,
        compatibilityScore: score,
        matchedSkills,
        availability: otherUser.availabilities[0] || 'Flexible',
        availabilities: otherUser.availabilities,
        levels: otherUser.levels
      });
    }

    //Sort by highest compatibility score first
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    //Fetch all match requests involving this user
    const matchRequests = await MatchRequest.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    });

    //Attach user profile data and match request status to the matches for the UI
    const populatedMatches = await Promise.all(
      matches.map(async (match) => {
        const userProfile = await User.findById(match.userId).select('fullName jobTitle profilePicture tagline');

        let requestStatus = 'none';
        const existingRequest = matchRequests.find(
          req => (req.fromUserId === userId && req.toUserId === match.userId) ||
            (req.fromUserId === match.userId && req.toUserId === userId)
        );

        if (existingRequest) {
          if (existingRequest.status === 'accepted') requestStatus = 'accepted';
          else if (existingRequest.status === 'rejected') requestStatus = 'rejected';
          else if (existingRequest.fromUserId === userId) requestStatus = 'sent_pending';
          else requestStatus = 'received_pending';
        }

        return {
          ...match,
          user: userProfile,
          matchStatus: requestStatus
        };
      })
    );

    res.status(200).json(populatedMatches);

  } catch (error) {
    console.error("Smart Match Error:", error);
    res.status(500).json({ message: 'Error generating smart matches' });
  }
});

//Send a match request
router.post('/request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ message: 'Missing user IDs' });
    }

    const existingRequest = await MatchRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A match request already exists between these users.' });
    }

    const newRequest = new MatchRequest({ fromUserId, toUserId, status: 'pending' });
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Match Request Error:", error);
    res.status(500).json({ message: 'Error sending match request' });
  }
});

//Get incoming pending requests for a user
router.get('/requests/pending', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const requests = await MatchRequest.find({ toUserId: userId, status: 'pending' });

    //Populate user details for each request
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const userProfile = await User.findById(request.fromUserId).select('fullName jobTitle profilePicture tagline');
        return {
          _id: request._id,
          fromUser: userProfile,
          createdAt: request.createdAt
        };
      })
    );

    res.status(200).json(populatedRequests);
  } catch (error) {
    console.error("Get Requests Error:", error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

//Respond to a match request
router.put('/respond', async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await MatchRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

    res.status(200).json(request);
  } catch (error) {
    console.error("Respond Request Error:", error);
    res.status(500).json({ message: 'Error responding to request' });
  }
});

module.exports = router;
