const express = require('express');
const router = express.Router();
const supabase = require('../config/databaseBackend.js');

// GET //volunteer-history
router.get('/', async (req, res) => {
  
  const { data, error } = await supabase
  .from('volunteerhistory')
  .select('*');

if (error) {
  console.error('Error fetching volunteer history:', error);
    return res.status(500).json({ error: 'Failed to fetch volunteer history' });
}
  console.log('Volunteer history:', data);
  res.json(data);
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