const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');


//locally stores the FCM token rather than the DB for now
const fcmTokens = {}; 


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

module.exports = router;