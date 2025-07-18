const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
const { fcmTokens } = require('../utils/fcmTokenStore');


// POST /api/notifications/send
router.post('/send', verifyToken, async (req, res) => {
  const { toUid, title, body } = req.body;
  const fromUid = req.user.uid;  // From the verified token middleware
  console.log("uid, title, body: ", toUid, title, body);

  if (!toUid || !title || !body) {
    return res.status(400).json({ error: 'Missing recipient uid, title, or body' });
  }

  const token = fcmTokens[toUid];

  //lack of token, abort sending a notification until token refresh
  if (!token) {
  console.warn(`No FCM token found for uid: ${toUid}`);
  return res.json({ 
    success: true, 
    message: `No FCM token found for uid: ${toUid}. Skipped sending notification.` 
  });
}

  const message = {
    notification: { title, body },
    token,
  };

  try {

    // Optional: store sender/recipient info in DB or logs here
    console.warn('FCM token is not registered anymore. Consider updating or deleting it.');

    res.json({ success: true, response, fromUid, toUid });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
    /*
    if (toUid && fcmTokens[toUid]) {
      console.log(`Removing FCM token for UID ${toUid}:`, fcmTokens[toUid]);
      delete fcmTokens[toUid]; // Remove invalid token
    }*/
    });
  }
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