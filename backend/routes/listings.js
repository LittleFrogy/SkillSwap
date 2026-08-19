const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const isConnected = () => mongoose.connection.readyState === 1;

let mockListings = [
  {
    _id: 'listing_1',
    userId: 'demo-user',
    type: 'teach',
    skill: 'React Development',
    proficiencyLevel: 'Advanced',
    description: 'Building fast, accessible web applications with modern React, Hooks, and Next.js.',
    weeklyAvailability: 'Mon, Wed (Evening)',
    days: ['Mon', 'Wed'],
    times: ['Evening'],
    endorsements: []
  },
  {
    _id: 'listing_2',
    userId: 'demo-user',
    type: 'learn',
    skill: 'Python Data Science',
    proficiencyLevel: 'Beginner',
    description: 'Looking to learn data visualization with Pandas, NumPy, and Matplotlib.',
    weeklyAvailability: 'Sat, Sun (Afternoon)',
    days: ['Sat', 'Sun'],
    times: ['Afternoon'],
    endorsements: []
  }
];

// GET /api/listings/skills/unique
// Fetches a list of all unique skills currently in the database to help with autocomplete/dropdowns
router.get('/skills/unique', async (req, res) => {
  try {
    if (isConnected()) {
      const uniqueSkills = await Listing.distinct('skill');
      return res.json(uniqueSkills.sort());
    }
    
    // Fallback to mock listings
    const skills = [...new Set(mockListings.map(l => l.skill))];
    res.json(skills.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings
router.get('/', async (req, res) => {
  try {
    const { userId, type } = req.query;
    if (isConnected()) {
      const query = {};
      if (userId) query.userId = userId;
      if (type) query.type = type;
      const listings = await Listing.find(query).sort({ createdAt: -1 });
      return res.json(listings);
    }

    let results = [...mockListings];
    if (userId) results = results.filter(l => l.userId === userId);
    if (type) results = results.filter(l => l.type === type);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    if (isConnected()) {
      const listings = await Listing.find({ userId: req.params.userId }).sort({ createdAt: -1 });
      return res.json(listings);
    }
    const results = mockListings.filter(l => l.userId === req.params.userId);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings/user/:userId/:type
router.get('/user/:userId/:type', async (req, res) => {
  try {
    if (isConnected()) {
      const listings = await Listing.find({ userId: req.params.userId, type: req.params.type }).sort({ createdAt: -1 });
      return res.json(listings);
    }
    const results = mockListings.filter(l => l.userId === req.params.userId && l.type === req.params.type);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    if (isConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) return res.status(404).json({ message: 'Listing not found' });
      return res.json(listing);
    }
    const listing = mockListings.find(l => l._id === req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/listings
router.post('/', async (req, res) => {
  try {
    const { userId, type, skill, proficiencyLevel, description, weeklyAvailability, days, times } = req.body;
    if (isConnected()) {
      const listing = new Listing({
        userId, type, skill, proficiencyLevel, description, weeklyAvailability, days, times
      });
      const saved = await listing.save();
      return res.status(201).json(saved);
    }

    const newListing = {
      _id: `listing_${Date.now()}`,
      userId: userId || 'demo-user',
      type, skill, proficiencyLevel, description, weeklyAvailability, days: days || [], times: times || [], endorsements: []
    };
    mockListings.push(newListing);
    res.status(201).json(newListing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/listings/:id
router.put('/:id', async (req, res) => {
  try {
    if (isConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) return res.status(404).json({ message: 'Listing not found' });
      
      const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.json(updated);
    }
    
    const idx = mockListings.findIndex(l => l._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Listing not found' });
    
    mockListings[idx] = { ...mockListings[idx], ...req.body };
    res.json(mockListings[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', async (req, res) => {
  try {
    if (isConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) return res.status(404).json({ message: 'Listing not found' });
      
      await Listing.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Listing deleted' });
    }
    
    const listing = mockListings.find(l => l._id === req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    mockListings = mockListings.filter(l => l._id !== req.params.id);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
