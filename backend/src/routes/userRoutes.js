// Import Express and Firebase token verification middleware
const express = require('express')
const {verifyToken} = require('../middleware/auth');
const supabase = require('../config/databaseBackend');

// New router instance
const router = express.Router();

// Protected test route (verify Firebase token)
// GET: Fetch user profile
router.get('/profile', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const { data: profile, error } = await supabase
      .from('userprofile')
      .select('*')
      .eq('uid', uid)
      .single();
    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ message: 'Token verified successfully', profile });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.post('/update-profile', verifyToken, async (req, res) => {
  const uid = req.user.uid.trim(); // Trim any whitespace
  console.log('UID for update-profile:', uid); // Debug log
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('userprofile')
      .update(updates)
      .eq('uid', uid)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'User not found or update failed' });
    }
    res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST: Create or update user profile
router.post('/create-profile', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const email = req.user.email;
  const profileData = req.body;

  try {
    // Insert into UserCredentials if not exists
    const { data: existing, error: findError } = await supabase
      .from('usercredentials')
      .select('uid')
      .eq('uid', uid)
      .single();

    if (!existing) {
      const { error: credError } = await supabase
        .from('usercredentials')
        .insert([{ uid, email, password: '', role: 'volunteer' }]);
      if (credError) {
        console.error('Error creating user credentials:', credError);
        return res.status(500).json({ error: 'Failed to create user credentials' });
      }
    }

    // Upsert UserProfile
    const { error: profileError } = await supabase
      .from('userprofile')
      .upsert([{ uid, ...profileData }], { onConflict: ['uid'] });

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      return res.status(500).json({ error: profileError.message });
    }

    res.json({ message: 'Profile created/updated successfully' });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Failed to create/update profile' });
  }
});


// Export router
module.exports = router;