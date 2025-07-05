// Setup
const express = require('express');
const cors = require('cors')
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();


// Import routes
const authRoutes = require('./routes/authRoutes')
const volunteerHistoryRoutes = require('./routes/volunteerHistoryRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');

// Create Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Volunteer Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            events: '/api/events',
            matching: '/api/matching',
            notifications: '/api/notifications',
            volunteerHistory: '/api/volunteer-history'
        }
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteer-history', volunteerHistoryRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested entity does not exist'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
});

module.exports = app;