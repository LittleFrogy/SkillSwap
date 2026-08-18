const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

// Get all registered users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

// Get User Profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Update User Profile
router.put('/:id', async (req, res) => {
    const { fullName, username, jobTitle, tagline, location, bio, profilePicture } = req.body;
    try {
        const updateData = { fullName, jobTitle, tagline, location, bio, profilePicture };
        if (username) {
            updateData.username = username;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            return res.status(400).json({ message: "Username is already taken" });
        }
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put('/:id/push-subscription', async (req, res) => {
    const { oneSignalPlayerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user id.' });
    }
    if (!oneSignalPlayerId || typeof oneSignalPlayerId !== 'string') {
        return res.status(400).json({ message: 'oneSignalPlayerId is required.' });
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { oneSignalPlayerId },
            { new: true, select: '-password' }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        console.log(`OneSignal Player ID saved for user ${req.params.id}`);
        res.json({ message: 'Push subscription saved.', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
