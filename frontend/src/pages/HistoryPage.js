import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, List, ListItem, ListItemText, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

const HistoryPage = () => {
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [focused, setFocused] = useState(false);

  // Hardcoded volunteer list
  const volunteerList = [
    {
      name: 'Jordan Smith',
      email: 'jordan@example.com',
      history: [
        { event: 'Food Drive', date: '2024-10-15', hours: 5, performance: 'Excellent' },
        { event: 'Park Cleanup', date: '2024-11-03', hours: 3, performance: 'Good' }
      ]
    },
    {
      name: 'Ava Chen',
      email: 'ava.chen@example.com',
      history: [
        { event: 'Toy Drive', date: '2024-12-01', hours: 4, performance: 'Excellent' },
        { event: 'Blood Drive', date: '2025-01-10', hours: 2, performance: 'Satisfactory' }
      ]
    },
    {
      name: 'Liam Patel',
      email: 'liam.patel@example.com',
      history: []
    }
  ];

  const filteredVolunteers = volunteerList.filter(vol =>
    vol.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectVolunteer = (vol) => {
    setSelectedVolunteer(vol);
    setSearch(vol.name);
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: 'auto',
        mt: 4,
        p: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: '#fafafa'
      }}
    >
      <Typography variant="h5" gutterBottom>
        Volunteer History
      </Typography>

      <TextField
        label="Search Volunteer"
        fullWidth
        value={search}
        onChange={(e) => {
            setSearch(e.target.value);
            setSelectedVolunteer(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)} // Delay to allow click
        sx={{ mb: 2 }}
        />

      {!selectedVolunteer && focused && (
        <Paper sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
          <List dense>
            {filteredVolunteers.length > 0 ? (
              filteredVolunteers.map((vol, index) => (
                <React.Fragment key={index}>
                  <ListItem button onClick={() => handleSelectVolunteer(vol)}>
                    <ListItemText primary={vol.name} secondary={vol.email} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No matches found" />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {selectedVolunteer && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            History for {selectedVolunteer.name} ({selectedVolunteer.email})
          </Typography>

          {selectedVolunteer.history.length === 0 ? (
            <Typography>No participation records found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Hours</TableCell>
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedVolunteer.history.map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{record.event}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell align="right">{record.hours}</TableCell>
                      <TableCell>{record.performance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default HistoryPage;