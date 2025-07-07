const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get matching volunteers for an event (admin only)
router.get('/:eventId', verifyToken, requireAdmin, matchingController.getMatchingVolunteers);

module.exports = router;