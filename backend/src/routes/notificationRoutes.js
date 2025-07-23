const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
//const { fcmTokens } = require('../utils/fcmTokenStore');
const { supabase } = require('../../supabaseClient.js');


// POST /api/notifications/send
router.post('/send', verifyToken, async (req, res) => {
  const { toUid, title, body } = req.body;
  const fromUid = req.user.uid;  // From the verified token middleware

  if (!toUid || !title || !body) {
    return res.status(400).json({ error: 'Missing recipient uid, title, or body' });
  }

   // Fetch FCM token from Supabase 
  const { data: tokens, error: tokenError } = await supabase
    .from('fcm_tokens')
    .select('fcm_token')
    .eq('user_id', toUid)
    .eq('is_active', true)
    .order('updated_at', { ascending: false }) //thisll choose the latest token
    .limit(1)
    .maybeSingle();

  if (tokenError) {
    console.error('Error fetching FCM token:', tokenError);
    return res.status(500).json({ error: 'Failed to fetch FCM token' });
  }

  console.log('FCM Token is: ', tokens);

  //lack of token, abort sending a notification until token refresh
  if (!tokens || !tokens.fcm_token) {
  console.warn(`No FCM token found for uid: ${toUid}`);
  return res.json({ 
    success: true, 
    message: `No FCM token found for uid: ${toUid}. Skipped sending notification.` 
  });
}

  const message = {
    notification: { title, body },
    token: tokens.fcm_token,
  };

  try {
    const response = await admin.messaging().send(message);

    // Optional: store sender/recipient info in DB or logs here

    res.json({ success: true, response, fromUid, toUid });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {
    console.warn('FCM token is not registered anymore. Consider updating or deleting it.');


    //this token is inactive now, updated the attribute
    /*
    await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', toUid)
        .eq('fcm_token', tokens.fcm_token);

    return res.status(410).json({
      success: false,
      message: 'FCM token not registered. Token marked inactive, please refresh on client.',
    });*/
  }
}});


// POST /api/save-fcm-token
router.post('/save-fcm-token', verifyToken, async (req, res) => {
  const { token } = req.body;
  const uid = req.user.uid;

  console.log("Backend FCM token saving: ", token);
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  // Upsert token in Supabase (insert or update)
  const { data, error } = await supabase
    .from('fcm_tokens')
    .upsert(
      {
        user_id: uid,
        fcm_token: token,
        is_active: true,
      },
      { onConflict: ['user_id', 'fcm_token'] } // Assumes user_id + fcm_token combo is unique
    );

     if (error) {
    console.error('Error saving FCM token:', error);
    return res.status(500).json({ success: false, error: 'Failed to save token' });
  }

  res.json({ success: true, message: 'Token saved' });
  
});


//pulls all the users for the volunteer list selection for notification sending
router.get('/volunteers', async (req, res) => {
  try {
    const users = [];
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(userRecord => {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || '',
        });
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;