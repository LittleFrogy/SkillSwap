const express = require('express');
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
    const {
        fullName,
        username,
        jobTitle,
        tagline,
        location,
        bio,
        profilePicture,
        preferredLanguage
    } = req.body;
    try {
        const updateData = { fullName, jobTitle, tagline, location, bio, profilePicture, preferredLanguage };
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

module.exports = router;
