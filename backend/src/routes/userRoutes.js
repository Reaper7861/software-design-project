// Import Express and Firebase token verification middleware
const express = require('express')
const {verifyToken} = require('../middleware/auth');
const supabase = require('../config/databaseBackend');
const bcrypt = require('bcryptjs');

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
    
    if (error && error.code === 'PGRST116') {
      // No profile found, return empty profile
      return res.json({ 
        message: 'Token verified successfully', 
        profile: {
          uid: uid,
          fullName: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zipCode: '',
          skills: [],
          preferences: '',
          availability: [],
          profileCompleted: false
        }
      });
    }
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    
    return res.json({ message: 'Token verified successfully', profile });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET: Check if user profile is completed
router.get('/profile-status', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    // First, check the user's role
    const { data: userCred, error: roleError } = await supabase
      .from('usercredentials')
      .select('role')
      .eq('uid', uid)
      .single();
    
    if (roleError) {
      return res.status(500).json({ error: 'Failed to check user role' });
    }
    
    // If user is admin, bypass profile completion requirement
    if (userCred.role === 'administrator' || userCred.role === 'admin') {
      return res.json({ profileCompleted: true });
    }
    
    // For volunteers, check if profile is completed
    const { data: profile, error } = await supabase
      .from('userprofile')
      .select('fullName, address1, city, state, zipCode, skills, availability, profileCompleted')
      .eq('uid', uid)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No profile found
      return res.json({ profileCompleted: false });
    }
    
    if (error) {
      console.error('Profile status check error:', error);
      return res.status(500).json({ error: 'Failed to check profile status' });
    }
    
    // First check if profileCompleted flag is set to true
    if (profile.profileCompleted === true) {
      return res.json({ profileCompleted: true });
    }
    
    // Fallback: Check if all required fields are filled
    const isCompleted = profile && 
      profile.fullName && 
      profile.address1 && 
      profile.city && 
      profile.state && 
      profile.zipCode && 
      profile.skills && 
      profile.skills.length > 0 && 
      profile.availability && 
      profile.availability.length > 0;
    
    return res.json({ profileCompleted: !!isCompleted });
  } catch (err) {
    console.error('Profile status check exception:', err);
    return res.status(500).json({ error: 'Failed to check profile status' });
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
  const {password} = req.body; 

  console.log('Create profile request:', { uid, email, hasPassword: !!password });

  try {
    // Insert into UserCredentials if not exists
    const { data: existing, error: findError } = await supabase
      .from('usercredentials')
      .select('uid')
      .eq('uid', uid)
      .single();

    console.log('Existing user check:', { existing, findError });

    if (!existing) {
      // Hash password if provided
      let hashedPassword = '';
      if (password) {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      console.log('Creating user credentials with uid:', uid);

      const { error: credError } = await supabase
        .from('usercredentials')
        .insert([{ uid, email, password: hashedPassword, role: 'volunteer' }]);
      
      if (credError) {
        console.error('Error creating user credentials:', credError);
        return res.status(500).json({ error: 'Failed to create user credentials', details: credError.message });
      }
    }

    // Upsert UserProfile with profileCompleted flag
    const { error: profileError } = await supabase
      .from('userprofile')
      .upsert([{ 
        uid, 
        ...profileData, 
        profileCompleted: true // Mark as completed when form is submitted
      }], { onConflict: ['uid'] });

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