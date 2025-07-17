import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button
} from '@mui/material';
import axios from 'axios';

const MatchPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // GET volunteers and matches
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setVolunteers(volunteerRes.data.volunteers);
        setMatches(volunteerRes.data.matches || []);

        // GET events
        const eventRes = await axios.get('http://localhost:8080/api/events');
        setEvents(eventRes.data.events.filter((e) => e.status !== 'deleted'));
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
  }, []);


  const handleCreateMatch = async () => {
    if (!selectedVolunteer || !selectedEvent) return;

    try {
      const res = await axios.post('http://localhost:8080/api/matching', {
        userId: selectedVolunteer.uid,
        eventId: selectedEvent.eventId,
      });

      if (res.data.success) {
        alert('Match successful!');
        // Refresh matches after successful match
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setMatches(volunteerRes.data.matches || []);

        //send the notification to volunteer here //
        await axios.post('http://localhost:8080/api/notifications/send', {
        uid: selectedVolunteer.uid,
        title: 'New Event Assignment',
        body: `You have been assigned to the event: ${selectedEvent.eventName}`,
      });

      console.log('Notification sent to volunteer');
      /** End notification stuff **/
      
      } else {
        alert(res.data.message || 'Match failed');
      }
    } catch (err) {
      alert('Server error during match');
      console.error(err);
    }
  };

  const handleRemoveMatch = async (userId, eventId) => {
    try {
      const res = await axios.delete('http://localhost:8080/api/matching', {
        data: { userId, eventId }
      });
      if (res.data.success) {
        alert('Volunteer unmatched successfully!');

        //** Send notification to volunteer about removal **//
      try {
        const messageRes = await axios.post('http://localhost:8080/api/notifications/send', {
          uid: userId,
          title: 'You have been removed from an event',
          body: `You have been removed from event ID: ${eventId}. If you have questions, please contact the coordinator.`
        });

        if (!messageRes.data.success) {
          console.warn('Notification sending failed:', messageRes.data.error);
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }
      /** End notification stuff **/

        // Refresh matches after successful unmatch
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setMatches(volunteerRes.data.matches || []);
      } else {
        alert(res.data.message || 'Unmatch failed');
      }
    } catch (err) {
      alert('Server error during unmatch');
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Volunteer Matching
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Volunteer Table */}
        <TableContainer component={Paper} sx={{ flex: '1 1 500px' }}>
          <Typography variant="h6" sx={{ p: 1 }}>
            Volunteers
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Zip</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Preferences</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteers.map((v) => (
                <TableRow
                  key={v.uid}
                  hover
                  selected={selectedVolunteer?.uid === v.uid}
                  onClick={() => setSelectedVolunteer(selectedVolunteer?.uid === v.uid ? null : v)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedVolunteer?.uid === v.uid ? '#e0f7fa' : 'inherit',
                  }}
                >
                  <TableCell>{v.profile?.fullName}</TableCell>
                  <TableCell>{v.profile?.address1}</TableCell>
                  <TableCell>{v.profile?.city}</TableCell>
                  <TableCell>{v.profile?.state}</TableCell>
                  <TableCell>{v.profile?.zipCode}</TableCell>
                  <TableCell>{v.profile?.skills?.join(', ')}</TableCell>
                  <TableCell>{v.profile?.preferences}</TableCell>
                  <TableCell>{Array.isArray(v.profile?.availability)
                    ? v.profile.availability.join(', ')
                    : Object.entries(v.profile?.availability || {})
                        .filter(([_, available]) => available)
                        .map(([day]) => day)
                        .join(', ')
                  }</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Events Table */}
        <TableContainer component={Paper} sx={{ flex: '1 1 500px' }}>
          <Typography variant="h6" sx={{ p: 1 }}>
            Events
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Required Skills</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((e) => (
                <TableRow
                  key={e.eventId}
                  hover
                  selected={selectedEvent?.eventId === e.eventId}
                  onClick={() => setSelectedEvent(selectedEvent?.eventId === e.eventId ? null : e)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedEvent?.eventId === e.eventId ? '#e0f7fa' : 'inherit',
                  }}
                >
                  <TableCell>{e.eventId}</TableCell>
                  <TableCell>{e.eventName}</TableCell>
                  <TableCell>{e.eventDescription}</TableCell>
                  <TableCell>{e.location}</TableCell>
                  <TableCell>{Array.isArray(e.requiredSkills) ? e.requiredSkills.join(', ') : e.requiredSkills}</TableCell>
                  <TableCell>{e.urgency}</TableCell>
                  <TableCell>{e.eventDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Match button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleCreateMatch}
          disabled={!selectedVolunteer || !selectedEvent}
        >
          Create Match
        </Button>
      </Box>

      {/* Existing Matches Table */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>Existing Matches</Typography>
        {matches.length === 0 ? (
          <Typography>No matches made yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Volunteer</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{m.user?.profile?.fullName || m.user?.fullName || m.userId}</TableCell>
                    <TableCell>{m.event?.eventName || m.eventId}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleRemoveMatch(m.userId, m.eventId)}
                      >
                        Unmatch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default MatchPage;
