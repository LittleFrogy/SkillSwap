const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
const listingRoutes = require('./routes/listings');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

// Since we are building just Module 1, we will skip actual MongoDB connection until the user provides a URI
// or we use a local one. For now, let's connect if MONGO_URI is present, otherwise just log a warning.
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err));
} else {
    console.warn("⚠️ MONGO_URI is not defined in .env. Skipping MongoDB connection for testing.");
}

app.get('/', (req, res) => {
    res.send('SkillSwap API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
