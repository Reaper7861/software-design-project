const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateEvent, validateEventUpdate } = require('../middleware/validation');

// Create a new event (admin only)
router.post('/', verifyToken, requireAdmin, validateEvent, eventController.createEvent);

// Update an existing event (admin only)
router.put('/:eventId', verifyToken, requireAdmin, validateEventUpdate, eventController.updateEvent);

// Get a specific event by ID (admin only)
router.get('/:eventId', verifyToken, requireAdmin, eventController.getEvent);

// Get all events (admin only)
router.get('/', verifyToken, requireAdmin, eventController.getAllEvents);

module.exports = router;