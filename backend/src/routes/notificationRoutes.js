const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');


// POST /api/notifications/send
router.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body' });
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

  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    await db.collection('fcmTokens').doc(uid).set({ token });
    res.json({ success: true, message: 'Token saved' });
  } catch (err) {
    console.error('Error saving FCM token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;