const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

// Apply authentication and admin authorization to all reporting routes
router.use(verifyToken);
router.use(requireAdmin);

// Get available report types
router.get('/', reportingController.getReportTypes);

// Generate volunteer participation report
router.get('/volunteers', reportingController.generateVolunteerReport);

// Generate event management report
router.get('/events', reportingController.generateEventReport);

module.exports = router; 