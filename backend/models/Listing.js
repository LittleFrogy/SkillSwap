const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        default: 'user_123'
    },
    type: {
        type: String,
        enum: ['teach', 'learn'],
        required: true
    },
    skill: {
        type: String,
        required: true,
        trim: true
    },
    proficiencyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    weeklyAvailability: {
        type: String,
        required: true
    },
    endorsements: {
        type: [Object],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
