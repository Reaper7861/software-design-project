const { createEvent, updateEvent, getEvent, getAllEvents } = require('../data/mockData');

const createEvent = (eventData) => {
    return createEvent(eventData);
};

const updateEvent = (eventId, updates) => {
    return updateEvent(eventId, updates);
};

const getEvent = (eventId) => {
    return getEvent(eventId);
};

const getAllEvents = () => {
    return getAllEvents();
};

module.exports = {
    createEvent,
    updateEvent,
    getEvent,
    getAllEvents
};