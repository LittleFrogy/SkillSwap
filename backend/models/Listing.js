const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    userId: {
        // In a real app this would be mongoose.Schema.Types.ObjectId ref to 'User'
        // For this module without full auth, we'll just use a string
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
    }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
