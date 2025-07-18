// Import hard coded mock data
const mockData = require('../data/mockData');

// Get authenticated uid from token
const requireAdmin = (req, res, next) => {
    const userId = req.user.uid;


// Look up user in mock data
const user = mockData.users.get(userId);


// If user doesn't exist, return 404
if(!user) {
    return res.status(404).json({error: 'User not found'});
}

// If not admin, return 403 (forbidden)
if(user.role !== 'administrator') {
    return res.status(403).json({error: 'Access denied - administrators only.'});
}


// Proceed to next handler
next();

};


// Export middleware for use
module.exports = {requireAdmin};