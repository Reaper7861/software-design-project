const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');


//locally stores the FCM token rather than the DB for now
const fcmTokens = {
  '92Gc2Al6jhV74vl1yiMJTd0nu1o2': 'cl3RvjTgPJbUcv9A8qWiAM:APA91bFjpCP749Q5UDJUBIPitF5ZJe63n8od-29jMMnJO92dR5-5oN4w7U8HdYmrpRvRKEs0B8mHxjajVAsmoMoiMm9o9-YCwps9n9vnPAMOa49hp17NLVw:APA91bFjpCP749Q5UDJUBIPitF5ZJe63n8od-29jMMnJO92dR5-5oN4w7U8HdYmrpRvRKEs0B8mHxjajVAsmoMoiMm9o9-YCwps9n9vnPAMOa49hp17NLVw:APA91bFjpCP749Q5UDJUBIPitF5ZJe63n8od-29jMMnJO92dR5-5oN4w7U8HdYmrpRvRKEs0B8mHxjajVAsmoMoiMm9o9-YCwps9n9vnPAMOa49hp17NLVw',

}; 


// POST /api/notifications/send
router.post('/send', async (req, res) => {
  const { uid, title, body } = req.body;

  if (!uid || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body' });
  }

  const token = fcmTokens[uid];

   if (!token) {
    return res.status(404).json({ error: `No FCM token found for uid: ${uid}` });
  }

  const message = {
    notification: { title, body },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/save-fcm-token
router.post('/save-fcm-token', verifyToken, async (req, res) => {
  const { token } = req.body;
  const uid = req.user.uid;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  fcmTokens[uid] = token;

  console.log('Current FCM tokens:', fcmTokens);
  
  res.json({ success: true, message: 'Token saved (in-memory)' });
  
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