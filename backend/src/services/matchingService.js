const { getEvent, findMatchingVolunteers } = require('../data/mockData');

const findMatchingVolunteers = (eventId) => {
    const event = getEvent(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    return findMatchingVolunteers(event);
};

module.exports = {
    findMatchingVolunteers
};