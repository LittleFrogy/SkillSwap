const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const Endorsement = require('../models/Endorsement');
const CreditTransaction = require('../models/CreditTransaction');
const Listing = require('../models/Listing');

// ─── Badge Definitions ────────────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  {
    id: 'first_session',
    name: 'First Step',
    description: 'Completed your very first session',
    icon: '🚀',
    tier: 'bronze'
  },
  {
    id: 'five_sessions_taught',
    name: 'Mentor',
    description: 'Taught 5 sessions',
    icon: '🎓',
    tier: 'silver'
  },
  {
    id: 'ten_sessions_taught',
    name: 'Master Teacher',
    description: 'Taught 10 sessions',
    icon: '🏫',
    tier: 'gold'
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Listed 3 or more different skills to teach',
    icon: '🌐',
    tier: 'silver'
  },
  {
    id: 'well_endorsed',
    name: 'Well Endorsed',
    description: 'Received 5 or more endorsements',
    icon: '⭐',
    tier: 'silver'
  },
  {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Received 10 or more endorsements',
    icon: '🏆',
    tier: 'gold'
  },
  {
    id: 'credit_collector',
    name: 'Credit Collector',
    description: 'Earned 20 or more skill credits',
    icon: '🪙',
    tier: 'bronze'
  },
  {
    id: 'top_earner',
    name: 'Top Earner',
    description: 'Earned 50 or more skill credits',
    icon: '💎',
    tier: 'gold'
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Completed sessions across 2 or more different weeks',
    icon: '📅',
    tier: 'silver'
  }
];

// ─── Badge Computation ────────────────────────────────────────────────────────
async function computeUserBadges(userId) {
  const userIdStr = userId.toString();

  // Sessions taught
  const sessionsTaught = await Session.countDocuments({
    teacherId: userId,
    $or: [{ status: 'completed' }, { scheduledTime: { $lt: new Date() } }]
  });

  // All sessions (taught or learned)
  const allSessions = await Session.find({
    $or: [{ teacherId: userId }, { learnerId: userId }],
    $or: [{ status: 'completed' }, { scheduledTime: { $lt: new Date() } }]
  }).select('scheduledTime').lean();

  // Endorsements received
  const endorsementsReceived = await Endorsement.countDocuments({ toUserId: userIdStr });

  // Credits earned
  const creditTxs = await CreditTransaction.find({ userId: userIdStr, type: 'earned' });
  const totalEarned = creditTxs.reduce((sum, t) => sum + t.amount, 0);

  // Unique skills listed to teach
  const teachListings = await Listing.find({ userId: userIdStr, type: 'teach' }).select('skill').lean();
  const uniqueTeachSkills = new Set(teachListings.map(l => l.skill.toLowerCase().trim())).size;

  // Sessions spread across weeks
  const weekKeys = new Set(
    allSessions.map(s => {
      const d = new Date(s.scheduledTime);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${week}`;
    })
  );

  const earnedIds = new Set();
  if (sessionsTaught >= 1 || allSessions.length >= 1) earnedIds.add('first_session');
  if (sessionsTaught >= 5)  earnedIds.add('five_sessions_taught');
  if (sessionsTaught >= 10) earnedIds.add('ten_sessions_taught');
  if (uniqueTeachSkills >= 3) earnedIds.add('polyglot');
  if (endorsementsReceived >= 5)  earnedIds.add('well_endorsed');
  if (endorsementsReceived >= 10) earnedIds.add('community_champion');
  if (totalEarned >= 20) earnedIds.add('credit_collector');
  if (totalEarned >= 50) earnedIds.add('top_earner');
  if (weekKeys.size >= 2) earnedIds.add('consistent');

  return {
    earnedIds,
    stats: { sessionsTaught, endorsementsReceived, totalEarned, uniqueTeachSkills, totalSessions: allSessions.length }
  };
}

// ─── GET /api/leaderboard/badges/:userId ─────────────────────────────────────
// Computes, awards, and returns badge state for a user
router.get('/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { earnedIds, stats } = await computeUserBadges(userId);

    // Award new badges that aren't already stored
    const existingIds = new Set(user.badges.map(b => b.id));
    let updated = false;
    for (const id of earnedIds) {
      if (!existingIds.has(id)) {
        user.badges.push({ id, earnedAt: new Date() });
        updated = true;
      }
    }
    if (updated) await user.save();

    // Build full badge list with locked/unlocked state
    const allBadges = BADGE_DEFINITIONS.map(def => {
      const earned = user.badges.find(b => b.id === def.id);
      return {
        ...def,
        earned: !!earned,
        earnedAt: earned ? earned.earnedAt : null
      };
    });

    res.json({ badges: allBadges, stats });
  } catch (err) {
    console.error('Badge fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/leaderboard?tab=alltime|weekly ──────────────────────────────────
// Returns ranked leaderboard; aggregates credits, sessions, endorsements
router.get('/', async (req, res) => {
  try {
    const tab = req.query.tab || 'alltime';
    const currentUserId = req.query.userId || null;

    // Date filter for weekly (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dateFilter = tab === 'weekly' ? { createdAt: { $gte: weekAgo } } : {};
    const sessionDateFilter = tab === 'weekly'
      ? { scheduledTime: { $gte: weekAgo } }
      : {};

    // Pull all users
    const users = await User.find({}, 'fullName username profilePicture skillCredits badges').lean();

    // Aggregate credits earned per user in timeframe
    const creditAgg = await CreditTransaction.aggregate([
      { $match: { type: 'earned', ...dateFilter } },
      { $group: { _id: '$userId', totalEarned: { $sum: '$amount' } } }
    ]);
    const creditMap = {};
    for (const c of creditAgg) creditMap[c._id] = c.totalEarned;

    // Aggregate endorsements received per user in timeframe
    const endorseAgg = await Endorsement.aggregate([
      { $match: { ...dateFilter } },
      { $group: { _id: '$toUserId', count: { $sum: 1 } } }
    ]);
    const endorseMap = {};
    for (const e of endorseAgg) endorseMap[e._id] = e.count;

    // Aggregate sessions completed per user in timeframe
    const sessionFilter = {
      $or: [{ status: 'completed' }, { scheduledTime: { $lt: new Date() } }],
      ...sessionDateFilter
    };
    const sessionAgg = await Session.aggregate([
      { $match: sessionFilter },
      {
        $facet: {
          asTeacher: [
            { $group: { _id: '$teacherId', sessions: { $sum: 1 } } }
          ],
          asLearner: [
            { $group: { _id: '$learnerId', sessions: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const sessionMap = {};
    if (sessionAgg.length > 0) {
      for (const r of sessionAgg[0].asTeacher) {
        const id = r._id.toString();
        sessionMap[id] = (sessionMap[id] || 0) + r.sessions;
      }
      for (const r of sessionAgg[0].asLearner) {
        const id = r._id.toString();
        sessionMap[id] = (sessionMap[id] || 0) + r.sessions;
      }
    }

    // Build ranked list
    const ranked = users.map(u => {
      const uid = u._id.toString();
      const creditsEarned = creditMap[uid] || 0;
      const endorsements = endorseMap[uid] || 0;
      const sessions = sessionMap[uid] || 0;
      // Composite score: credits×3 + endorsements×2 + sessions×1
      const score = creditsEarned * 3 + endorsements * 2 + sessions;

      return {
        _id: uid,
        fullName: u.fullName,
        username: u.username,
        profilePicture: u.profilePicture || '',
        skillCredits: u.skillCredits,
        badgeCount: (u.badges || []).length,
        badges: (u.badges || []).map(b => {
          const def = BADGE_DEFINITIONS.find(d => d.id === b.id);
          return def ? { ...def, earnedAt: b.earnedAt } : null;
        }).filter(Boolean),
        stats: { creditsEarned, endorsements, sessions },
        score
      };
    });

    // Sort by composite score desc, filter out users with 0 activity
    ranked.sort((a, b) => b.score - a.score || b.skillCredits - a.skillCredits);

    // Add rank position
    const leaderboard = ranked.map((u, i) => ({ ...u, rank: i + 1 }));

    // Find current user's entry
    let currentUserEntry = null;
    if (currentUserId) {
      currentUserEntry = leaderboard.find(u => u._id === currentUserId) || null;
    }

    res.json({ leaderboard: leaderboard.slice(0, 50), currentUserEntry, tab });
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Export badge definitions for reuse
router.badgeDefinitions = BADGE_DEFINITIONS;
module.exports = router;
