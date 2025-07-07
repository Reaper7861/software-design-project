const eventService = require('../services/eventService');

const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        const event = await eventService.createEvent(eventData);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const updates = req.body;
        const event = await eventService.updateEvent(eventId, updates);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await eventService.getEvent(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createEvent,
    updateEvent,
    getEvent,
    getAllEvents
};