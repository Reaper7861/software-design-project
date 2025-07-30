import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, TextField, Paper, List, ListItem, ListItemButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';



const HistoryPage = () => {

  //used for searching through table for specific volunteer
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  //used for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);


///call the backend here
useEffect(() => {
    fetch('http://localhost:8080/api/volunteer-history') //replace later //
      .then(res => res.json())
      .then(data => {
        setAllHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch history:', err);
        setLoading(false);
      });
  }, []);

  //map the data, also make sure its actually valid data and not broken
const volunteerList = React.useMemo(() => {
  return Array.from(
    new Set(
      allHistory
        .map(entry => entry.volunteername)
        .filter(name => typeof name === 'string')
    )
  );
}, [allHistory]);

  // Filter volunteers based on search input
  const filteredVolunteers = volunteerList.filter(name =>
    (name || '').toLowerCase().includes(search.toLowerCase())
  );

  // If selectedVolunteer no longer exists in list (e.g., after data reload), clear it
  useEffect(() => {
    if (selectedVolunteer && !volunteerList.includes(selectedVolunteer)) {
      setSelectedVolunteer(null);
      setSearch('');
    }
  }, [volunteerList, selectedVolunteer]);

  // Filter history by selected volunteer
  const filteredHistory = selectedVolunteer
    ? allHistory.filter(entry => entry.volunteername === selectedVolunteer)
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

    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Volunteer Participation History
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'start' }}>
        <Box sx={{ width: 300 }}>
          <TextField
            label="Search Volunteer"
            fullWidth
            value={search}
            color='taupe'
            inputProps={{ maxLength: 50 }}
            helperText={`${search.length}/50 characters`}
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
            color='secondary'
            variant="outlined"
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
                <TableCell>{event.volunteername}</TableCell>
                <TableCell>{event.eventname}</TableCell>
                <TableCell>{event.eventdescription}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.requiredskills}</TableCell>
                <TableCell>{event.urgency}</TableCell>
                <TableCell>{event.eventdate && new Date(event.eventdate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</TableCell>
                <TableCell>{event.participationstatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

        {/*Pagination stuff */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
        <Button
         variant='contained'
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </Button>
        <Typography sx={{ alignSelf: 'center' }}>
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          variant='contained'
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </Button>
      </Box>
</Paper>
    </Box>
  );
};

export default HistoryPage;