const express = require('express');
const router = express.Router();
const { matchVolunteer, getAllMatches, getEventMatches, unmatchVolunteer } = require('../controllers/matchingController');


// POST to assign volunteer to event
router.post('/', matchVolunteer);
// GET all matches
router.get('/', getAllMatches); 
// GET matches for a specific event
router.get('/:eventId', getEventMatches);
// DELETE unmatch volunteer
router.delete('/', unmatchVolunteer);


module.exports = router;
