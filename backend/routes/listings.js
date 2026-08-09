const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

// In-memory fallback if MongoDB is not connected
let mockListings = [];
let mockIdCounter = 1;

const isConnected = () => mongoose.connection.readyState === 1;

// Get all listings for a user
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'user_123'; 
        if (isConnected()) {
            const listings = await Listing.find({ userId });
            res.json(listings);
        } else {
            res.json(mockListings.filter(l => l.userId === userId));
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new listing
router.post('/', async (req, res) => {
    const data = {
        userId: req.body.userId || 'user_123',
        type: req.body.type,
        skill: req.body.skill,
        proficiencyLevel: req.body.proficiencyLevel,
        description: req.body.description,
        weeklyAvailability: req.body.weeklyAvailability
    };

    try {
        if (isConnected()) {
            const listing = new Listing(data);
            const newListing = await listing.save();
            res.status(201).json(newListing);
        } else {
            const newListing = { ...data, _id: `mock_${mockIdCounter++}`, createdAt: new Date() };
            mockListings.push(newListing);
            res.status(201).json(newListing);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a listing
router.put('/:id', async (req, res) => {
    try {
        if (isConnected()) {
            const listing = await Listing.findById(req.params.id);
            if (!listing) return res.status(404).json({ message: 'Listing not found' });

            listing.skill = req.body.skill || listing.skill;
            listing.proficiencyLevel = req.body.proficiencyLevel || listing.proficiencyLevel;
            listing.description = req.body.description || listing.description;
            listing.weeklyAvailability = req.body.weeklyAvailability || listing.weeklyAvailability;

            const updatedListing = await listing.save();
            res.json(updatedListing);
        } else {
            const idx = mockListings.findIndex(l => l._id === req.params.id);
            if (idx === -1) return res.status(404).json({ message: 'Listing not found' });
            
            mockListings[idx] = { ...mockListings[idx], ...req.body };
            res.json(mockListings[idx]);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a listing
router.delete('/:id', async (req, res) => {
    try {
        if (isConnected()) {
            const listing = await Listing.findById(req.params.id);
            if (!listing) return res.status(404).json({ message: 'Listing not found' });

            await listing.deleteOne();
            res.json({ message: 'Listing deleted' });
        } else {
            mockListings = mockListings.filter(l => l._id !== req.params.id);
            res.json({ message: 'Listing deleted' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
