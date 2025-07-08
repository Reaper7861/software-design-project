const { assignVolunteerToEvent, getEventMatches, unmatchVolunteerFromEvent } = require('../data/mockData');
const {mockData} = require('../data/mockData');


// POST 
const matchVolunteerHandler = (req, res) => {
    const { userId, eventId } = req.body;

    const match = assignVolunteerToEvent(userId, eventId);
    if (!match) {
        return res.status(400).json({ success: false, message: "Invalid user or event ID" });
    }

    res.status(201).json({ success: true, message: "Volunteer assigned to event", match });
};

// GET all matches and all completed volunteers
const getAllMatchesAndVolunteersHandler = (req, res) => {
  const volunteers = Array.from(mockData.users.entries())
    .filter(([uid, user]) => user.profile?.profileCompleted)
    .map(([uid, user]) => ({
      ...user,
      uid,
    }));

  const matches = [];

  for (const [eventId, volunteerSet] of mockData.eventRegistrations.entries()) {
    const event = mockData.events.get(eventId);
    for (const userId of volunteerSet) {
      const user = mockData.users.get(userId);
      if (user && event) {
        matches.push({
          userId,
          user,
          eventId,
          event
        });
      }
    }
  }

  res.json({ success: true, volunteers, matches });
};

// GET 
const getMatchesForEventHandler = (req, res) => {
    const matches = getEventMatches(req.params.eventId);
    res.json({ success: true, matches });
};

// DELETE
const unmatchVolunteerForEventHandler = (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ success: false, message: "Missing userId or eventId" });
  }

  const success = unmatchVolunteerFromEvent(userId, eventId);

  if (!success) {
    return res.status(404).json({ success: false, message: "User or Event not found or not matched" });
  }

  return res.json({ success: true, message: "Volunteer unmatched from event" });
};


module.exports = {
    matchVolunteer: matchVolunteerHandler,
    getAllMatches: getAllMatchesAndVolunteersHandler,
    getEventMatches: getMatchesForEventHandler,
    unmatchVolunteer: unmatchVolunteerForEventHandler
};
