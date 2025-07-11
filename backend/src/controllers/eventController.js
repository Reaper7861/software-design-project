const {createEvent, getAllEvents, getEvent, updateEvent, deleteEvent} = require('../data/mockData');


// Create Event
const createEventHandler = (req, res) => {
  try {
    const event = createEvent(req.body);
    res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("Create Event Error:", err); 
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

// Get All Events
const getAllEventsHandler = (req, res) => {
  try {
    const events = getAllEvents();
    res.status(200).json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

// Get Single Event
const getEventByIdHandler = (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.json({ success: true, event });
};

// Update Event
const updateEventHandler = (req, res) => {
  const updated = updateEvent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.json({ success: true, event: updated });
};

// Delete Event 
const deleteEventHandler = (req, res) => {
  const deleted = deleteEvent(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.json({ success: true, message: "Event deleted successfully" });
};


module.exports = {
  createEvent: createEventHandler,
  getAllEvents: getAllEventsHandler,
  getEventById: getEventByIdHandler,
  updateEvent: updateEventHandler,
  deleteEvent: deleteEventHandler
};
