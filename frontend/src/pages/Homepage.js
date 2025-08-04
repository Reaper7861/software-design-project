import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from "firebase/auth";
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function HomePage() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [fullName, setFullName] = useState(''); // Added state for full name

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const idToken = await getAuth().currentUser.getIdToken();
        
        // Fetch profile for availability and fullName
        const profileRes = await axios.get('http://localhost:8080/api/users/profile', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        setAvailability(profileRes.data.profile.availability || []);
        setFullName(profileRes.data.profile.fullName || ''); // Set full name from profile

        // Fetch assigned events
        const assignedRes = await axios.get('http://localhost:8080/api/matching', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const userAssigned = assignedRes.data.matches.filter(m => m.uid === user.uid && m.participationstatus === 'assigned');
        setAssignedEvents(userAssigned);

        // Fetch history
        const historyRes = await axios.get('http://localhost:8080/api/volunteer-history', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const userHistory = historyRes.data.filter(h => h.uid === user.uid);
        setHistory(userHistory);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAddDate = async () => {
    if (!newDate) return;
    try {
      const idToken = await getAuth().currentUser.getIdToken();
      const updatedAvailability = [...availability, newDate];
      await axios.post('http://localhost:8080/api/users/update-profile', {
        availability: updatedAvailability
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setAvailability(updatedAvailability);
      setNewDate('');
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleRemoveDate = async (dateToRemove) => {
    try {
      const idToken = await getAuth().currentUser.getIdToken();
      const updatedAvailability = availability.filter(date => date !== dateToRemove);
      await axios.post('http://localhost:8080/api/users/update-profile', {
        availability: updatedAvailability
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setAvailability(updatedAvailability);
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  if (!user) {
    return (
      <>
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2,
            backgroundColor: 'rgba(138, 154, 91, 0.3)',
          }}
        >
          <Container>
            <Typography color="primary" variant="h3" gutterBottom sx={{
              color: 'beige.main',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
            }}>
              Welcome to ServeTogether
            </Typography>
            <Typography variant="h6" color="secondary" gutterBottom sx={{
              color: 'darkbeige.main',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
            }}>
              For volunteer scheduling, event management, and more.
            </Typography>
            <Button variant="contained" color="secondary" size="large" href="/login">
              Get Started
            </Button>
          </Container>
        </Box>
        <Box sx={{ py: 2, backgroundColor: '#E6E2D3', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} SoftwareDesign. All rights reserved.
          </Typography>
        </Box>
      </>
    );
  }

  // Show loading message until data is fetched
  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading your data...</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'rgba(138, 154, 91, 0.3)' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
        Welcome, {fullName || 'User'} {/* Updated to show fullName with fallback */}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Left Section: Update Availability */}
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Your Availability
          </Typography>
          <Box sx={{ mb: 2 }}>
            {availability.map((date, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography>{new Date(date).toLocaleDateString()}</Typography>
                <IconButton onClick={() => handleRemoveDate(date)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={handleAddDate} startIcon={<AddIcon />}>
              Add Date
            </Button>
          </Box>
        </Paper>

        {/* Right Section: Assigned Events */}
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Assigned Events
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.eventname}</TableCell>
                    <TableCell>{new Date(event.eventdate).toLocaleDateString()}</TableCell>
                    <TableCell>{event.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Bottom Section: User's History */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Your Volunteer History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.eventname}</TableCell>
                  <TableCell>{new Date(entry.eventdate).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.participationstatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default HomePage;