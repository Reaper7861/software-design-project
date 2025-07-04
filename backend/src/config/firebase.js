// Import Firebase Admin SDK
const admin = require('firebase-admin');


// Load service account information
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase admin with service account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//firestore support to store FCM tokens for each user
const db = admin.firestore();

// Export initialized admin instance
module.exports = admin;