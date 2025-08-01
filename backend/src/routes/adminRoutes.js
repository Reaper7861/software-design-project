const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');

const supabase = require('../config/databaseBackend.js');


//grabs all users + their profile info
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('userprofile')
      .select('uid, fullName, usercredentials(email, role)')
      .order('fullName', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    const users = data.map(user => ({
      uid: user.uid,
      fullName: user.fullName,
      email: user.usercredentials?.email || '',
      role: user.usercredentials?.role || 'volunteer'
    }));

    //console.log("ALL USERS: ", users);
    res.json({ users });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

////here is where we can call the setrole.js file
router.patch('/users/:uid/role', verifyToken, async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;

  if (!['administrator', 'volunteer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const { data, error } = await supabase
      .from('usercredentials')
      .update({ role })
      .eq('uid', uid)
      .select();

    if (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({ error: 'Failed to update role' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `Role updated to ${role}`, user: data[0] });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// grabs all events from eventdetails table
router.get('/events', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventdetails')
      .select('*')
      .order('eventdate', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    res.json({ events: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;