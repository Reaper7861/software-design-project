import React, { useState } from 'react';
import {
  Box, Button, Typography, TextField, Paper, List, ListItem, ListItemButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

// TO DO //
/*
Ability to soft-delete entries

*/

const HistoryPage = () => {

  //used for searching through table for specific volunteer
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  //used for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Hardcoded volunteer list
  const volunteerList = [
    'Jordan Smith',
    'Ava Chen',
    'Liam Patel',
    'Maria Gonzalez'
  ];

  const allHistory = [
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
    }
  ];

  const filteredVolunteers = volunteerList.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = selectedVolunteer
    ? allHistory.filter(entry => entry.volunteer === selectedVolunteer)
    : allHistory;



  //sorting history by date
  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);

  //for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = sortedHistory.slice(indexOfFirstItem, indexOfLastItem);

  return (
  <Box sx={{ p: 3,  minHeight: '100vh',  backgroundColor: 'rgba(138, 154, 91, 0.3)'}}>
      <Typography color='primary' variant="h5" gutterBottom>
        Volunteer Participation History
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'start' }}>
        <Box sx={{ width: 300 }}>
          <TextField
            label="Search Volunteer"
            color='primary' 
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedVolunteer(null);
            }}
          />
          {!selectedVolunteer && search && (
            <List dense sx={{ border: '1px solid #ccc', maxHeight: 200, overflowY: 'auto' }}>
              {filteredVolunteers.map((name, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton onClick={() => {
                    setSelectedVolunteer(name);
                    setSearch(name);
                  }}>
                    {name}
                  </ListItemButton>
                </ListItem>
              ))}
              {filteredVolunteers.length === 0 && (
                <ListItem>
                  <Typography variant="body2" sx={{ p: 1 }}>No matches found</Typography>
                </ListItem>
              )}
            </List>
          )}
        </Box>

        {selectedVolunteer && (
          <Button
            onClick={() => {
              setSelectedVolunteer(null);
              setSearch('');
            }}
            variant="outlined"
            color="secondary"
            sx={{ height: '40px' }}
          >
            Clear Filter
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Volunteer</TableCell>
              <TableCell>Event Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Required Skills</TableCell>
              <TableCell>Urgency</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Participation Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.map((event, index) => (
              <TableRow key={index}>
                <TableCell>{event.volunteer}</TableCell>
                <TableCell>{event.eventName}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.requiredSkills}</TableCell>
                <TableCell>{event.urgency}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.participationStatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

        {/*Pagination stuff */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
        <Button
         color="secondary"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </Button>
        <Typography sx={{ alignSelf: 'center' }}>
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          color="secondary"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </Button>
      </Box>

    </Box>
  );
};

export default HistoryPage;