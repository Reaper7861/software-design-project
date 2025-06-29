// Import Express and Firebase token verification middleware
const express = require('express')
const {verifyToken} = require('../middleware/auth');


// New router instance
const router = express.Router();

// Protected test route (verify Firebase token)
// GET: Fetch user profile
router.get('/profile', verifyToken, (req, res) => {
    console.log('Token verified. User: ', req.user);
    res.json({message: 'Token verified successfully', user: req.user});
});


// Export router
module.exports = router;