// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Load service account information
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase admin with service account
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Export initialized admin instance
module.exports = {
    auth: admin.auth()
};