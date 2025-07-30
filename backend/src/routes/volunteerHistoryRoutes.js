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

module.exports = router;