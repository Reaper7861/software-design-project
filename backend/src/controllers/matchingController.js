const matchingService = require('../services/matchingService');

const getMatchingVolunteers = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const matches = await matchingService.findMatchingVolunteers(eventId);
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMatchingVolunteers
};