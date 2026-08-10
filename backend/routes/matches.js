const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for smart matching.' });
    }

    // 1. Fetch current user's listings to understand their needs/offerings
    const myListings = await Listing.find({ userId });
    
    const myLearnSkills = myListings.filter(l => l.type === 'learn').map(l => l.skill.toLowerCase());
    const myTeachSkills = myListings.filter(l => l.type === 'teach').map(l => l.skill.toLowerCase());

    // 2. Fetch all OTHER users' listings
    const otherListings = await Listing.find({ userId: { $ne: userId } });

    // Group listings by user
    const usersMap = {};
    otherListings.forEach(listing => {
      if (!usersMap[listing.userId]) {
        usersMap[listing.userId] = {
          userId: listing.userId,
          teaches: [],
          learns: [],
        };
      }
      if (listing.type === 'teach') {
        usersMap[listing.userId].teaches.push(listing.skill.toLowerCase());
      } else if (listing.type === 'learn') {
        usersMap[listing.userId].learns.push(listing.skill.toLowerCase());
      }
    });

    const matches = [];

    // 3. Calculate compatibility scores
    for (const otherUserId in usersMap) {
      const otherUser = usersMap[otherUserId];
      
      let score = 0;
      let matchedSkills = {
        theyCanTeachYou: [],
        youCanTeachThem: []
      };

      // Check if they teach what I want to learn
      otherUser.teaches.forEach(skill => {
        if (myLearnSkills.includes(skill)) {
          score += 40; // Base score for finding a teacher
          matchedSkills.theyCanTeachYou.push(skill);
        }
      });

      // Check if I teach what they want to learn
      otherUser.learns.forEach(skill => {
        if (myTeachSkills.includes(skill)) {
          score += 40; // Base score for finding a student
          matchedSkills.youCanTeachThem.push(skill);
        }
      });

      // Mutual Value Bonus! (Holy Grail of Skill Swapping)
      if (matchedSkills.theyCanTeachYou.length > 0 && matchedSkills.youCanTeachThem.length > 0) {
        score += 20;
      }

      // Cap score at 100
      score = Math.min(score, 100);

      // Only push if there's SOME level of match (score > 0)
      if (score > 0) {
        matches.push({
          userId: otherUser.userId,
          compatibilityScore: score,
          matchedSkills
        });
      }
    }

    // Sort by highest compatibility score first
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // 4. Attach user profile data to the matches for the UI
    const populatedMatches = await Promise.all(
      matches.map(async (match) => {
        const userProfile = await User.findById(match.userId).select('fullName jobTitle profilePicture tagline');
        return {
          ...match,
          user: userProfile
        };
      })
    );

    res.status(200).json(populatedMatches);

  } catch (error) {
    console.error("Smart Match Error:", error);
    res.status(500).json({ message: 'Error generating smart matches' });
  }
});

module.exports = router;
