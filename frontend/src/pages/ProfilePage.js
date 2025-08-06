import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, Grid, Chip, Stack,
  TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, Dialog } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from "firebase/auth";
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ProfileForm from '../components/ProfileForm';
import '../css/ReportingPage.css';


function ProfilePage() {
  const { user, refreshProfileStatus } = useAuth();
  
  // Helper function to format dates
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'No date';
    }
    try {
      const dateString = dateValue.includes('T') ? dateValue : dateValue + 'T00:00:00';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', dateValue, error);
      return 'Invalid date';
    }
  };
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

          // Fetch volunteer history and filter for assigned events
          const historyRes = await axios.get('http://localhost:8080/api/volunteer-history', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          const userHistory = historyRes.data.filter(h => h.uid === user.uid);
          setHistory(userHistory);
         
         // Filter assigned events from volunteer history
         const userAssigned = userHistory.filter(h => h.participationstatus === 'Assigned');
         setAssignedEvents(userAssigned);

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
      <div className='any-container'>
      <Typography variant="h1" gutterBottom>
        Welcome, {profileData?.fullName || 'User'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h3">Profile Information</Typography>
                <Button variant="contained" onClick={handleOpen}>
                  Edit
                </Button>
              </Box>
              
              <Box mt={2}>
                {[
                  { label: "Name", value: profileData.fullName },
                  { label: "Address", value: 
                    <>
                      {profileData.address1}
                      {profileData.city && `, ${profileData.city}`}
                      {profileData.state && `, ${profileData.state}`}
                      {profileData.zipCode && ` ${profileData.zipCode}`}
                    </>
                  },
                  { label: "Skills", value: profileData.skills, isArray: true },
                  { label: "Preferences", value: profileData.preferences && profileData.preferences.trim() !== "" 
                    ? profileData.preferences 
                    : "None",  
                    preLine: true },
                  { label: "Availability", value: profileData.availability, preLine: true, isArray: true },
                ].map(({ label, value, preLine, isArray  }) => (
                  <Grid container key={label} spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                    <Grid item xs={4} sm={3}>
                      <Typography variant="body2" fontWeight="bold">
                        {label}:
                      </Typography>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      {isArray ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {value && value.length > 0 ? (
                            value.map((item, index) => (
                              <Chip key={index} label={item} size="small" />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={preLine ? { whiteSpace: "pre-line" } : undefined}
                        >
                          {value}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Box>
        </Paper>

        
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h3" gutterBottom>
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
                     <TableCell>{formatDate(event.eventdate)}</TableCell>
                     <TableCell>{event.location}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h3" gutterBottom>
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
                      <TableCell>{formatDate(entry.eventdate)}</TableCell>
                      <TableCell>{entry.participationstatus}</TableCell>
                    </TableRow>
                  ))}
               </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      </div>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <ProfileForm ref={formRef} initialData={profileData} onSubmit={handleProfileSubmit} onClose={handleClose} />
      </Dialog>
    </Box>
  );
}

export default ProfilePage;