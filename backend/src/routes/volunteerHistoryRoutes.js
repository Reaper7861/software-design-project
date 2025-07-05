const express = require('express');
const router = express.Router();

// GET //volunteer-history
router.get('/', (req, res) => {
  
  // HARDCODED DATA BELOW ///
  const volunteerData = [
    {
      volunteer: 'Jordan Smith',
      eventName: 'Community Cleanup',
      description: 'Neighborhood-wide trash pickup and recycling event.',
      location: 'Maple Street Park',
      requiredSkills: 'Teamwork, Physical Stamina',
      urgency: 'High',
      date: '2025-06-15',
      participationStatus: 'Attended'
    },
    {
      volunteer: 'Ava Chen',
      eventName: 'Food Drive',
      description: 'Sorting and distributing food items for families in need.',
      location: 'Central Food Bank',
      requiredSkills: 'Organization, Communication',
      urgency: 'Medium',
      date: '2025-05-30',
      participationStatus: 'No-show'
    },
    {
      volunteer: 'Jordan Smith',
      eventName: 'Animal Shelter Support',
      description: 'Help clean cages and walk dogs at the local shelter.',
      location: 'Greenwood Shelter',
      requiredSkills: 'Empathy, Animal Care',
      urgency: 'Low',
      date: '2025-05-10',
      participationStatus: 'Attended'
    },
  ];
  res.json(volunteerData);
});

module.exports = router;