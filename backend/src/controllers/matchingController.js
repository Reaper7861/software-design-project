const supabase = require('../config/databaseBackend');

// POST: Assign volunteer to event
const matchVolunteerHandler = async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    // Fetch volunteer profile
    const { data: volunteerProfile, error: profileError } = await supabase
      .from('userprofile')
      .select('"fullName"')
      .eq('uid', userId)
      .single();
    if (profileError || !volunteerProfile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    // Fetch event details
    const { data: eventDetails, error: eventError } = await supabase
      .from('eventdetails')
      .select('*')
      .eq('eventid', eventId)
      .single();
    if (eventError || !eventDetails) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Insert into volunteerhistory with all details
    const { data, error } = await supabase
      .from('volunteerhistory')
      .insert([{
        uid: userId,
        volunteername: volunteerProfile.fullName,
        eventid: eventId,
        eventname: eventDetails.eventName,
        eventdescription: eventDetails.eventDescription,
        location: eventDetails.location,
        requiredskills: eventDetails.requiredSkills,
        urgency: eventDetails.urgency,
        eventdate: eventDetails.eventDate,
        participationstatus: 'Assigned'
      }])
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
    if (volError) {
      console.error('Error fetching volunteers:', volError);
      throw volError;
    }

    // Filter out volunteers with no profile
    const filteredVolunteers = (volunteers || []).filter(v => v.profile);

    // Get all matches with user email
    const { data: matches, error: matchError } = await supabase
      .from('volunteerhistory')
      .select('*');
    if (matchError) {
      console.error('Error fetching matches:', matchError);
      throw matchError;
    }


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