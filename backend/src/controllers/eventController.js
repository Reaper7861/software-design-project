const supabase = require('../config/databaseBackend');

// Create Event
const createEventHandler = async (req, res) => {
  try {
    const { eventname, eventdescription, eventdate, location, requiredskills, urgency } = req.body;
    const { data, error } = await supabase
      .from('eventdetails')
      .insert([{ eventname, eventdescription, eventdate, location, requiredskills, urgency}])
      .select();
    if (error) throw error;
    res.status(201).json({ success: true, event: data[0] });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

// Get All Events
const getAllEventsHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventdetails')
      .select('*');
    if (error) throw error;
    res.status(200).json({ success: true, events: data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

// Get Single Event
const getEventByIdHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventdetails')
      .select('*')
      .eq('eventid', req.params.id)
      .single();
    if (error || !data) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, event: data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch event" });
  }
};

// Update Event
const updateEventHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventdetails')
      .update(req.body)
      .eq('eventid', req.params.id)
      .select();
    if (error || !data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, event: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update event" });
  }
};

// Delete Event
const deleteEventHandler = async (req, res) => {
  try {
    const { error } = await supabase
      .from('eventdetails')
      .delete()
      .eq('eventid', req.params.id);
    if (error) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete event" });
  }
};

module.exports = {
  createEvent: createEventHandler,
  getAllEvents: getAllEventsHandler,
  getEventById: getEventByIdHandler,
  updateEvent: updateEventHandler,
  deleteEvent: deleteEventHandler
};
