import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button
} from '@mui/material';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from "firebase/auth"; //used for authentication

const MatchPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  //keeps track of the user so that we can send notifs
  const [user, setUser] = useState(null);

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

  //** User authentication here **//
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

    const handleCreateMatch = async () => {
    if (!selectedVolunteer || !selectedEvent) return;

    // Check if the volunteer is already matched to the event
    const alreadyMatched = matches.some(
      (m) => m.uid === selectedVolunteer.uid && m.eventid === selectedEvent.eventid
    );

    if (alreadyMatched) {
      alert('This volunteer is already matched to this event.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8080/api/matching', {
        userId: selectedVolunteer.uid,
        eventId: selectedEvent.eventid,
      });

      if (res.data.success) {
        alert('Match successful!');
        // Refresh matches after successful match
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setMatches(volunteerRes.data.matches || []);

        // *** send the notification to volunteer here - start*** //
        const idToken = await user.getIdToken();
        console.log("User uid: ", selectedVolunteer.uid);

        await fetch('http://localhost:8080/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            toUid: selectedVolunteer.uid,
            title: 'New Event Assignment',
            body: `You have been assigned to the event: ${selectedEvent.eventname}`,
          }),
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
          const idToken = await user.getIdToken();

          const messageRes = await fetch('http://localhost:8080/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              toUid: userId,
              title: 'You have been removed from an event',
              body: `You have been removed from event ID: ${eventId}. If you have questions, please contact the coordinator.`,
            }),
          });

          const messageData = await messageRes.json();

          if (!messageData.success) {
            console.warn('Notification sending failed:', messageData.error);
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
                    backgroundColor: selectedVolunteer?.uid === v.uid ? '#adadadff' : 'inherit',
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
                <TableCell>Required Skills</ TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((e) => (
                <TableRow
                  key={e.eventid}
                  hover
                  selected={selectedEvent?.eventid === e.eventid}
                  onClick={() => setSelectedEvent(selectedEvent?.eventid === e.eventid ? null : e)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedEvent?.eventid === e.eventid ? '#e0f7fa' : 'inherit',
                  }}
                >
                  <TableCell>{e.eventid}</TableCell>
                  <TableCell>{e.eventname}</TableCell>
                  <TableCell>{e.eventdescription}</TableCell>
                  <TableCell>{e.location}</TableCell>
                  <TableCell>{Array.isArray(e.requiredskills) ? e.requiredskills.join(', ') : e.requiredskills}</TableCell>
                  <TableCell>{e.urgency}</TableCell>
                  <TableCell>{e.eventdate}</TableCell>
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

      {/* Existing Matches Section */}

      <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: 'white' }}>Existing Matches</Typography>
          {matches.length === 0 ? (
              <Typography>No matches made yet.</Typography>
          ) : (
              <div>
                  {/* Group matches by event ID */}
                  {Object.entries(matches.reduce((acc, m) => {
                      if (!acc[m.eventid]) {
                          acc[m.eventid] = [];
                      }
                      acc[m.eventid].push(m);
                      return acc;
                  }, {})).map(([eventid, eventMatches]) => {
                      // Find the event details from the events state
                      const event = events.find(e => e.eventid === parseInt(eventid));

                      return (
                          <Box key={eventid} sx={{ mb: 4, bgcolor: 'white', borderRadius: 1, border: '1px solid #ccc', padding: 2 }}>
                              {/* Event Information Table */}
                              {event ? (
                                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                                      <Typography variant="h6" sx={{ p: 1 }}>
                                          Event
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
                                              <TableRow>
                                                  <TableCell>{event.eventid}</TableCell>
                                                  <TableCell>{event.eventname}</TableCell>
                                                  <TableCell>{event.eventdescription}</TableCell>
                                                  <TableCell>{event.location}</TableCell>
                                                  <TableCell>{Array.isArray(event.requiredskills) ? event.requiredskills.join(', ') : event.requiredskills}</TableCell>
                                                  <TableCell>{event.urgency}</TableCell>
                                                  <TableCell>{event.eventdate}</TableCell>
                                              </TableRow>
                                          </TableBody>
                                      </Table>
                                  </TableContainer>
                              ) : (
                                  <Typography>Event details not found for Event ID: {eventid}</Typography>
                              )}

                              {/* Volunteer Information - offset */}
                              <Box sx={{ ml: 3 }}>
                                  <TableContainer component={Paper}>
                                      <Typography variant="h6" sx={{ p: 1 }}>
                                          Volunteers
                                      </Typography>
                                      <Table size="small">
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
                                                  <TableCell>Action</TableCell>
                                              </TableRow>
                                          </TableHead>
                                          <TableBody>
                                              {eventMatches.map((m) => {
                                                  const volunteer = volunteers.find(v => v.uid === m.uid);

                                                  return volunteer ? (
                                                      <TableRow key={m.uid}>
                                                          <TableCell>{volunteer.profile?.fullName || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.address1 || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.city || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.state || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.zipCode || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.skills?.join(', ') || 'N/A'}</TableCell>
                                                          <TableCell>{volunteer.profile?.preferences || 'N/A'}</TableCell>
                                                          <TableCell>{Array.isArray(volunteer.profile?.availability) ? volunteer.profile.availability.join(', ') : 'N/A'}</TableCell>
                                                          <TableCell>
                                                              <Button
                                                                  variant="outlined"
                                                                  color="error"
                                                                  onClick={() => handleRemoveMatch(m.uid, m.eventid)}
                                                              >
                                                                  Unmatch
                                                              </Button>
                                                          </TableCell>
                                                      </TableRow>
                                                  ) : (
                                                      <TableRow key={m.uid}>
                                                          <TableCell colSpan={9}>Volunteer details not found for UID: {m.uid}</TableCell>
                                                      </TableRow>
                                                  );
                                              })}
                                          </TableBody>
                                      </Table>
                                  </TableContainer>
                              </Box>
                          </Box>
                      );
                  })}
              </div>
          )}
      </Box>
    </Box>
  );
};

export default MatchPage;
