// Import Express and Firebase token verification middleware
const express = require('express')
const {verifyToken} = require('../middleware/auth');
const { getUser,updateUser } = require('../data/mockData');

// New router instance
const router = express.Router();

// Protected test route (verify Firebase token)
// GET: Fetch user profile
router.get('/profile', verifyToken, (req, res) => {
  const uid = req.user.uid;
  const user = getUser(uid);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('Token verified. User: ', req.user);
  return res.json({ message: 'Token verified successfully', profile: user.profile });
});



router.post('/update-profile', verifyToken, (req, res) => {

    console.log("you updated ");

    const uid = req.user.uid;
    const updates = req.body;

    const updatedUser = updateUser(uid, updates);
  
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    res.json(updatedUser.profile);

    
  });

router.post('/create-profile', verifyToken, (req, res) => {

    const uid = req.user.uid;
    const updates = req.body;

    //send to database
  
    console.log("you created ", updates);

    res.json("You created!");

  });


// Export router
module.exports = router;