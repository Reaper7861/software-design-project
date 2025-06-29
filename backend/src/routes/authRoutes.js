// Setup
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {verifyToken} = require('../middleware/auth');
const{validateRegistration} = require('../middleware/validation');


// Public routes
router.post('/register', validateRegistration, authController.register);

// Protected routes (authentication required)
router.get('/me', verifyToken, authController.getCurrentUser);


module.exports = router;