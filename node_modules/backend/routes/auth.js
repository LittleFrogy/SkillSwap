const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const isConnected = () => mongoose.connection.readyState === 1;
// Mock DB array for testing without MongoDB connection
let mockUsers = [];

// Sign Up
router.post('/signup', async (req, res) => {
    const { fullName, username, email, password } = req.body;

    try {
        if (isConnected()) {
            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(400).json({ message: "Email already exists" });
                }
                if (existingUser.username === username) {
                    return res.status(400).json({ message: "Username already taken" });
                }
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            const user = new User({
                fullName,
                username,
                email,
                password: hashedPassword
            });

            await user.save();
            res.status(201).json({ message: "User created successfully", userId: user._id });
        } else {
            // Fallback for when MongoDB isn't connected
            const existingUser = mockUsers.find(u => u.email === email || u.username === username);
            if (existingUser) {
                if (existingUser.email === email) return res.status(400).json({ message: "Email already exists" });
                if (existingUser.username === username) return res.status(400).json({ message: "Username already taken" });
            }
            mockUsers.push({ _id: `mock_user_${Date.now()}`, fullName, username, email, password });
            res.status(201).json({ message: "User created successfully (Mock)", userId: mockUsers[mockUsers.length - 1]._id });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Sign In
router.post('/signin', async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or username

    try {
        if (isConnected()) {
            const user = await User.findOne({
                $or: [{ email: identifier }, { username: identifier }]
            });

            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            res.json({ message: "Logged in successfully", userId: user._id, fullName: user.fullName });
        } else {
            // Mock fallback
            const user = mockUsers.find(u => u.email === identifier || u.username === identifier);
            if (!user || user.password !== password) {
                return res.status(400).json({ message: "Invalid credentials" });
            }
            res.json({ message: "Logged in successfully (Mock)", userId: user._id, fullName: user.fullName });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
