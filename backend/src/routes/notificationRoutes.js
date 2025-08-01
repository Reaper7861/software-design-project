const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
//const { fcmTokens } = require('../utils/fcmTokenStore');
const supabase = require('../config/databaseBackend.js');


// GET /api/notifications - get notifications for logged in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:userprofile!sender_uid(fullName),
        receiver:userprofile!receiver_uid(fullName)
      `)
      .or(`sender_uid.eq.${uid},receiver_uid.eq.${uid}`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    console.log(JSON.stringify(data, null, 2));
    res.json(data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


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

    // Insert notification record into notifications table
    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert([{
        sender_uid: fromUid,
        receiver_uid: toUid,
        subject: title,
        message: body,
        timestamp: new Date().toISOString(),
        is_read: false
      }]);

    if (insertError) {
      console.error('Error inserting notification into database:', insertError);
      // it still responds success since FCM sent succeeded,
      // but it's good to notify about DB failure.
      return res.status(500).json({ 
        success: false, 
        message: 'Notification sent but failed to save in database',
        error: insertError.message
      });
    }

    res.json({ success: true, response, fromUid, toUid });

  } catch (error) {
    console.error('Error sending notification:', error);
    
  if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {

    console.warn('FCM token is not registered anymore. Consider updating or deleting it.');


    //this token is inactive now, updated the attribute
  
    try {
      await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', toUid)
        .eq('fcm_token', tokens.fcm_token);
    } catch (dbError) {
      console.error('Failed to deactivate token:', dbError);
    }
    
    return res.status(410).json({
      success: false,
      message: 'FCM token not registered. Token marked inactive, please refresh on client.',
    });
  }

  // All other errors
  res.status(500).json({ 
    success: false,
    error: error.message 
  });

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
//BUT ONLY IF THEY HAVE AN FCM TOKEN + NOTIFICATIONS ON
router.get('/volunteers', async (req, res) => {
  try {
    // fetch all active FCM token user_ids from Supabase
    const { data: activeTokens, error } = await supabase
      .from('fcm_tokens')
      .select('user_id')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return res.status(500).json({ error: 'Failed to fetch FCM tokens' });
    }

    const tokenUserIds = new Set(activeTokens.map(t => t.user_id));

    // fetch all firebase auth users
    const users = [];
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(userRecord => {
        if (tokenUserIds.has(userRecord.uid)) {
          users.push({
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
          });
        }
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // fetch fullName from Supabase userprofile table
    const { data: profiles, error: profileError } = await supabase
      .from('userprofile')
      .select('uid, fullName')
      .in('uid', users.map(u => u.uid));

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profiles' });
    }

    // finall y merge profile data into the users list
    const profileMap = new Map(profiles.map(p => [p.uid, p.fullName]));
    const enrichedUsers = users.map(user => ({
      ...user,
      fullName: profileMap.get(user.uid)
    }));

    res.json(enrichedUsers);   //////sending packet HERE

    //res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;