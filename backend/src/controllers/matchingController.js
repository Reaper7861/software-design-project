const supabase = require('../config/databaseBackend');

// POST: Assign volunteer to event
const matchVolunteerHandler = async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    // Insert into volunteerhistory
    const { data, error } = await supabase
      .from('volunteerhistory')
      .insert([{ uid: userId, eventid: eventId }])
      .select();
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(201).json({ success: true, message: "Volunteer assigned to event", match: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to assign volunteer" });
  }
};

// GET: All matches and all completed volunteers
const getAllMatchesAndVolunteersHandler = async (req, res) => {
  try {
    // Get all volunteers with their profile
    const { data: volunteers, error: volError } = await supabase
      .from('usercredentials')
      .select(`
        uid,
        email,
        role,
        profile:userprofile (
          "fullName",
          address1,
          address2,
          city,
          state,
          "zipCode",
          skills,
          preferences,
          availability
        )
      `)
      .eq('role', 'volunteer');
    if (volError) throw volError;

    // Filter out volunteers with no profile (profile === null)
    const filteredVolunteers = (volunteers || []).filter(v => v.profile);

    // Get all matches, joining eventdetails and usercredentials
    const { data: matches, error: matchError } = await supabase
      .from('volunteerhistory')
      .select(`
        *,
        event:eventid (
          eventid,
          eventname,
          eventdescription,
          location,
          requiredskills,
          urgency,
          eventdate
        ),
        user:uid (
          uid,
          email
        )
      `);
    if (matchError) throw matchError;

    res.json({ success: true, volunteers: filteredVolunteers, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch matches/volunteers" });
  }
};

// GET: Matches for a specific event
const getMatchesForEventHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('volunteerhistory')
      .select('*')
      .eq('eventid', req.params.eventId);
    if (error) throw error;
    res.json({ success: true, matches: data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch matches" });
  }
};

// DELETE: Unmatch volunteer from event
const unmatchVolunteerForEventHandler = async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const { error } = await supabase
      .from('volunteerhistory')
      .delete()
      .eq('uid', userId)
      .eq('eventid', eventId);
    if (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.json({ success: true, message: "Volunteer unmatched from event" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to unmatch volunteer" });
  }
};

module.exports = {
  matchVolunteer: matchVolunteerHandler,
  getAllMatches: getAllMatchesAndVolunteersHandler,
  getEventMatches: getMatchesForEventHandler,
  unmatchVolunteer: unmatchVolunteerForEventHandler
};
