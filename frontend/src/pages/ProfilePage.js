import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, Dialog } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from "firebase/auth";
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ProfileForm from '../components/ProfileForm';

function ProfilePage() {
  const { user, refreshProfileStatus } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [open, setOpen] = useState(false);
  const formRef = useRef();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const idToken = await getAuth().currentUser.getIdToken();
const profileRes = await axios.get('http://localhost:8080/api/users/profile', {
  headers: { Authorization: `Bearer ${idToken}` }
});
        setProfileData(profileRes.data.profile);
        setAvailability(profileRes.data.profile.availability || []);

        const assignedRes = await axios.get('http://localhost:8080/api/matching', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const userAssigned = assignedRes.data.matches.filter(m => m.uid === user.uid && m.participationstatus === 'assigned');
        setAssignedEvents(userAssigned);

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
    if (availability.includes(newDate)) {
      setAvailabilityError('This date is already selected.');
      return;
    }
    setAvailabilityError('');
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
      
      // Refresh profile status to update caution symbol immediately
      await refreshProfileStatus();
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
      
      // Refresh profile status to update caution symbol
      await refreshProfileStatus();
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (formRef.current && formRef.current.hasUnsavedChanges()) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (confirmDiscard) {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  const handleProfileSubmit = async (savedData) => {
    try {
      const idToken = await getAuth().currentUser.getIdToken();
      const profileRes = await axios.get('http://localhost:8080/api/users/profile', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setProfileData(profileRes.data.profile);
      setAvailability(profileRes.data.profile.availability || []);
      
      // Refresh profile status to update caution symbol
      await refreshProfileStatus();
      
      // Update the form's initial data without closing the dialog
      if (formRef.current) {
        formRef.current.updateInitialData(savedData);
      }
    } catch (err) {
      console.error('Error refreshing profile data:', err);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading your data...</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'rgba(138, 154, 91, 0.3)' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
        Welcome, {profileData?.fullName || 'User'}
      </Typography>
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>
        My Info
      </Button>
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Your Availability
          </Typography>
          <Box sx={{ mb: 2 }}>
            {availability.map((date, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography>{new Date(date + 'T00:00:00').toLocaleDateString()}</Typography>
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
            <Button
              variant="contained"
              onClick={handleAddDate}
              startIcon={<AddIcon />}
              disabled={!newDate}
            >
              Add Date
            </Button>
          </Box>
          {availabilityError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {availabilityError}
            </Typography>
          )}
        </Paper>
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
                    <TableCell>{new Date(event.eventdate + 'T00:00:00').toLocaleDateString()}</TableCell>
                    <TableCell>{event.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
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
              { history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.eventname}</TableCell>
                  <TableCell>{new Date(entry.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                  <TableCell>{entry.participationstatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <ProfileForm ref={formRef} initialData={profileData} onSubmit={handleProfileSubmit} onClose={handleClose} />
      </Dialog>
    </Box>
  );
}

export default ProfilePage;