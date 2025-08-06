const express = require('express');
const router = express.Router();
const supabase = require('../config/databaseBackend.js');

// GET //volunteer-history
router.get('/', async (req, res) => {
  try {
    // Get all volunteer history entries
    const { data: historyData, error: historyError } = await supabase
      .from('volunteerhistory')
      .select('*');

    if (historyError) {
      console.error('Error fetching volunteer history:', historyError);
      return res.status(500).json({ error: 'Failed to fetch volunteer history' });
    }

    // Get event details for each history entry
    const historyWithEventDetails = await Promise.all(
      (historyData || []).map(async (historyEntry) => {
        if (historyEntry.eventid) {
          const { data: eventDetails } = await supabase
            .from('eventdetails')
            .select('eventname, eventdescription, requiredskills, eventdate')
            .eq('eventid', historyEntry.eventid)
            .single();
          
          return {
            ...historyEntry,
            eventname: eventDetails?.eventname || historyEntry.eventname,
            eventdescription: eventDetails?.eventdescription || historyEntry.eventdescription,
            requiredskills: eventDetails?.requiredskills || historyEntry.requiredskills,
            eventdate: eventDetails?.eventdate || historyEntry.eventdate
          };
        }
        return historyEntry;
      })
    );

    console.log('Volunteer history with event details:', historyWithEventDetails);
    res.json(historyWithEventDetails);
  } catch (error) {
    console.error('Error in volunteer history route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/:eventId/:uid/status', async (req, res) => {
  const { eventId, uid } = req.params;
  const { status } = req.body;

  const validStatuses = ['Assigned', 'Attended', 'No Show'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { data, error } = await supabase
      .from('volunteerhistory')
      .update({ participationstatus: status })
      .eq('eventid', eventId)
      .eq('uid', uid);

    if (error) throw error;

    res.status(200).json({ message: 'Participation status updated successfully', data });
  } catch (err) {
    console.error('Error updating participation status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;