// Import Firebase Admin SDK
const { auth } = require('../config/firebase');

// Middleware to verify Firebase ID token
const verifyToken = async(req, res, next) => {
    const header = req.headers.authorization;

    // If no token or wrong format, access denied
    if(!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({error: 'No token provided'});
    }

    // Extract token
    const idToken = header.split('Bearer ')[1];

    try {
        const decoded = await auth.verifyIdToken(idToken);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed: ', error);
        res.status(401).json({error: 'Invalid token'});
    }
};

module.exports = {verifyToken};