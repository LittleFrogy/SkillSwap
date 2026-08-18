const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

const isConnected = () => mongoose.connection.readyState === 1;

// In-memory user & ledger storage fallback when MongoDB is not connected
const mockUsers = [
  {
    _id: 'demo-user',
    fullName: 'Alicia Chen',
    username: 'aliciachen',
    email: 'alicia@example.com',
    password: 'password123',
    jobTitle: 'Senior Product Designer',
    tagline: 'Building intuitive digital experiences',
    location: 'San Francisco, CA',
    bio: 'Passionate designer and tech enthusiast interested in React, Python, and UI design.',
    profilePicture: '',
    skillCredits: 5
  }
];

const mockTransactions = [
  {
    _id: 'tx_welcome_demo',
    userId: 'demo-user',
    type: 'grant',
    amount: 5,
    title: 'Welcome Bootstrap Grant',
    description: 'Initial credit grant awarded to start exchanging skills.',
    partnerUserId: null,
    partnerName: '',
    skill: 'SkillSwap Community',
    balanceAfter: 5,
    createdAt: new Date().toISOString()
  }
];

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    if (isConnected()) {
      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }]
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User with that email or username already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        fullName: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        skillCredits: 5 // Bootstrap grant amount
      });

      const savedUser = await newUser.save();

      // Log initial bootstrap grant transaction in ledger
      const grantTx = new CreditTransaction({
        userId: savedUser._id.toString(),
        type: 'grant',
        amount: 5,
        title: 'Welcome Bootstrap Grant',
        description: 'Welcome gift! Initial skill credits grant to jumpstart your skill exchange.',
        skill: 'SkillSwap Welcome',
        balanceAfter: 5
      });
      await grantTx.save();

      return res.status(201).json({
        message: 'User created successfully with 5 bootstrap skill credits!',
        userId: savedUser._id.toString(),
        user: {
          _id: savedUser._id.toString(),
          fullName: savedUser.fullName,
          username: savedUser.username,
          email: savedUser.email,
          skillCredits: savedUser.skillCredits
        }
      });
    }

    // In-memory fallback mode
    const existing = mockUsers.find(u => u.email === cleanEmail || u.username === cleanUsername);
    if (existing) {
      return res.status(400).json({ message: 'User with that email or username already exists.' });
    }

    const newId = `user_${Date.now()}`;
    const mockUser = {
      _id: newId,
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      skillCredits: 5
    };
    mockUsers.push(mockUser);

    mockTransactions.push({
      _id: `tx_${Date.now()}`,
      userId: newId,
      type: 'grant',
      amount: 5,
      title: 'Welcome Bootstrap Grant',
      description: 'Welcome gift! Initial skill credits grant to jumpstart your skill exchange.',
      skill: 'SkillSwap Welcome',
      balanceAfter: 5,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      message: 'User created successfully with 5 bootstrap skill credits!',
      userId: newId,
      user: {
        _id: newId,
        fullName: mockUser.fullName,
        username: mockUser.username,
        email: mockUser.email,
        skillCredits: mockUser.skillCredits
      }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }

    const cleanId = identifier.toLowerCase().trim();

    if (isConnected()) {
      const user = await User.findOne({
        $or: [{ email: cleanId }, { username: cleanId }]
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== user.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      return res.json({
        message: 'Logged in successfully',
        userId: user._id.toString(),
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          skillCredits: user.skillCredits
        }
      });
    }

    // In-memory fallback
    const user = mockUsers.find(u => u.email === cleanId || u.username === cleanId);
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    return res.json({
      message: 'Logged in successfully',
      userId: user._id,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        skillCredits: user.skillCredits
      }
    });

  } catch (err) {
    console.error("Signin Error:", err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

module.exports = router;
module.exports.mockUsers = mockUsers;
module.exports.mockTransactions = mockTransactions;
