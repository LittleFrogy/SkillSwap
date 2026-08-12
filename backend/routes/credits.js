const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { mockUsers, mockTransactions } = require('./auth');

const isConnected = () => mongoose.connection.readyState === 1;

// Helper to calculate balance and stats from ledger / user
async function getUserCreditData(userId) {
  if (isConnected()) {
    let user = await User.findById(userId);
    
    // Auto-create user if missing (for legacy or demo IDs)
    if (!user) {
      user = new User({
        _id: userId,
        fullName: 'SkillSwap Member',
        username: `user_${userId.slice(-6)}`,
        email: `${userId}@skillswap.local`,
        password: 'password123',
        skillCredits: 5
      });
      try {
        await user.save();
        // Log welcome grant
        const grantTx = new CreditTransaction({
          userId,
          type: 'grant',
          amount: 5,
          title: 'Welcome Bootstrap Grant',
          description: 'Initial bootstrap grant awarded to start exchanging skills.',
          skill: 'SkillSwap Bootstrap',
          balanceAfter: 5
        });
        await grantTx.save();
      } catch (e) {
        // Handle duplicate key or fallback silently
      }
    }

    const transactions = await CreditTransaction.find({ userId }).sort({ createdAt: -1 });

    const totalEarned = transactions
      .filter(t => t.type === 'earned' || t.type === 'grant')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSpent = transactions
      .filter(t => t.type === 'spent')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      skillCredits: user.skillCredits,
      totalEarned,
      totalSpent,
      totalTransactions: transactions.length,
      user
    };
  }

  // In-memory fallback
  let user = mockUsers.find(u => u._id === userId);
  if (!user) {
    user = {
      _id: userId,
      fullName: 'SkillSwap Member',
      username: `user_${userId}`,
      email: `${userId}@skillswap.local`,
      password: 'password123',
      skillCredits: 5
    };
    mockUsers.push(user);
    mockTransactions.push({
      _id: `tx_${Date.now()}`,
      userId,
      type: 'grant',
      amount: 5,
      title: 'Welcome Bootstrap Grant',
      description: 'Initial bootstrap grant awarded to start exchanging skills.',
      skill: 'SkillSwap Bootstrap',
      balanceAfter: 5,
      createdAt: new Date().toISOString()
    });
  }

  const userTxs = mockTransactions.filter(t => t.userId === userId);
  const totalEarned = userTxs
    .filter(t => t.type === 'earned' || t.type === 'grant')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalSpent = userTxs
    .filter(t => t.type === 'spent')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    skillCredits: user.skillCredits,
    totalEarned,
    totalSpent,
    totalTransactions: userTxs.length,
    user
  };
}

// GET /api/credits/balance/:userId
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await getUserCreditData(userId);
    res.json(data);
  } catch (err) {
    console.error("Fetch credit balance error:", err);
    res.status(500).json({ message: 'Error fetching credit balance', error: err.message });
  }
});

// GET /api/credits/ledger/:userId
router.get('/ledger/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (isConnected()) {
      const transactions = await CreditTransaction.find({ userId }).sort({ createdAt: -1 });
      return res.json(transactions);
    }

    const userTxs = mockTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userTxs);
  } catch (err) {
    console.error("Fetch credit ledger error:", err);
    res.status(500).json({ message: 'Error fetching credit ledger', error: err.message });
  }
});

// POST /api/credits/session-exchange
// Executes credit transfer: Learner spends 2 credits, Teacher earns 2 credits
router.post('/session-exchange', async (req, res) => {
  try {
    const { teacherId, learnerId, skill, amount = 2, description = '', sessionId = null } = req.body;

    if (!teacherId || !learnerId || !skill) {
      return res.status(400).json({ message: 'Teacher ID, Learner ID, and Skill are required.' });
    }

    if (teacherId === learnerId) {
      return res.status(400).json({ message: 'Teacher and Learner cannot be the same user.' });
    }

    const transferAmount = Number(amount) > 0 ? Number(amount) : 2;

    let actualLearnerId = learnerId;
    let actualTeacherId = teacherId;

    if (isConnected()) {
      // Validate ObjectIds before querying to prevent CastErrors
      const isValidLearner = mongoose.Types.ObjectId.isValid(actualLearnerId);
      const isValidTeacher = mongoose.Types.ObjectId.isValid(actualTeacherId);

      let learner = isValidLearner ? await User.findById(actualLearnerId) : null;
      let teacher = isValidTeacher ? await User.findById(actualTeacherId) : null;

      // Auto-create demo partner if they are using the default "user_2" mock ID in the UI
      if (!isValidLearner && actualLearnerId === 'user_2') {
        const demoPartnerId = new mongoose.Types.ObjectId();
        learner = new User({ _id: demoPartnerId, fullName: 'Bob Martin (Demo)', username: 'bob_demo_' + Date.now(), email: 'bob' + Date.now() + '@demo.local', password: 'pwd', skillCredits: 10 });
        await learner.save();
        actualLearnerId = demoPartnerId.toString();
      }
      
      if (!isValidTeacher && actualTeacherId === 'user_2') {
        const demoPartnerId = new mongoose.Types.ObjectId();
        teacher = new User({ _id: demoPartnerId, fullName: 'Bob Martin (Demo)', username: 'bob_demo_' + Date.now(), email: 'bob' + Date.now() + '@demo.local', password: 'pwd', skillCredits: 10 });
        await teacher.save();
        actualTeacherId = demoPartnerId.toString();
      }

      if (!learner) return res.status(404).json({ message: 'Learner user not found.' });
      if (!teacher) return res.status(404).json({ message: 'Teacher user not found.' });

      // Check balance requirement
      if (learner.skillCredits < transferAmount) {
        return res.status(400).json({
          message: `Insufficient skill credits. Learner has ${learner.skillCredits} credits, but ${transferAmount} credits are required.`
        });
      }

      // Update balances
      learner.skillCredits -= transferAmount;
      teacher.skillCredits += transferAmount;

      await learner.save();
      await teacher.save();

      // Write ledger entries
      const learnerTx = new CreditTransaction({
        userId: actualLearnerId,
        type: 'spent',
        amount: transferAmount,
        title: `Learned: ${skill}`,
        description: description || `Completed learning session for ${skill}`,
        partnerUserId: actualTeacherId,
        partnerName: teacher.fullName || 'Teacher',
        skill,
        sessionId,
        balanceAfter: learner.skillCredits
      });

      const teacherTx = new CreditTransaction({
        userId: actualTeacherId,
        type: 'earned',
        amount: transferAmount,
        title: `Taught: ${skill}`,
        description: description || `Completed teaching session for ${skill}`,
        partnerUserId: actualLearnerId,
        partnerName: learner.fullName || 'Learner',
        skill,
        sessionId,
        balanceAfter: teacher.skillCredits
      });

      await learnerTx.save();
      await teacherTx.save();

      return res.json({
        message: `Successfully exchanged ${transferAmount} skill credits!`,
        learner: { userId: actualLearnerId, balance: learner.skillCredits },
        teacher: { userId: actualTeacherId, balance: teacher.skillCredits },
        transactions: [learnerTx, teacherTx]
      });
    }

    // In-memory fallback
    const learner = mockUsers.find(u => u._id === learnerId) || { _id: learnerId, fullName: 'Learner', skillCredits: 5 };
    const teacher = mockUsers.find(u => u._id === teacherId) || { _id: teacherId, fullName: 'Teacher', skillCredits: 5 };

    if (learner.skillCredits < transferAmount) {
      return res.status(400).json({
        message: `Insufficient skill credits. Learner has ${learner.skillCredits} credits, but ${transferAmount} credits are required.`
      });
    }

    learner.skillCredits -= transferAmount;
    teacher.skillCredits += transferAmount;

    const now = new Date().toISOString();
    const learnerTx = {
      _id: `tx_spent_${Date.now()}`,
      userId: learnerId,
      type: 'spent',
      amount: transferAmount,
      title: `Learned: ${skill}`,
      description: description || `Completed learning session for ${skill}`,
      partnerUserId: teacherId,
      partnerName: teacher.fullName || 'Teacher',
      skill,
      sessionId,
      balanceAfter: learner.skillCredits,
      createdAt: now
    };

    const teacherTx = {
      _id: `tx_earned_${Date.now()}`,
      userId: teacherId,
      type: 'earned',
      amount: transferAmount,
      title: `Taught: ${skill}`,
      description: description || `Completed teaching session for ${skill}`,
      partnerUserId: learnerId,
      partnerName: learner.fullName || 'Learner',
      skill,
      sessionId,
      balanceAfter: teacher.skillCredits,
      createdAt: now
    };

    mockTransactions.push(learnerTx, teacherTx);

    res.json({
      message: `Successfully exchanged ${transferAmount} skill credits!`,
      learner: { userId: learnerId, balance: learner.skillCredits },
      teacher: { userId: teacherId, balance: teacher.skillCredits },
      transactions: [learnerTx, teacherTx]
    });

  } catch (err) {
    console.error("Session credit exchange error:", err);
    res.status(500).json({ message: 'Error processing credit exchange', error: err.message });
  }
});

module.exports = router;

