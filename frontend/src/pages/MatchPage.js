import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Tooltip
} from '@mui/material';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from "firebase/auth"; //used for authentication

const MatchPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matches, setMatches] = useState([]);

  const [currentVolunteerPage, setCurrentVolunteerPage] = useState(1);
  const [currentEventPage, setCurrentEventPage] = useState(1);

  const itemsPerPage = 4;
  const [user, setUser] = useState(null);

  // Function to check if location matches between volunteer and event
  const checkLocationMatch = (volunteer, event) => {
    const volunteerCity = volunteer.profile?.city?.toLowerCase() || '';
    const eventLocation = event.location?.toLowerCase() || '';
    return eventLocation.includes(volunteerCity) || volunteerCity.includes(eventLocation);
  };

  // Function to check if at least one date matches between volunteer and event
  const checkDateMatch = (volunteer, event) => {
    let eventDate;
    try {
      // Extract just the date part from the event datetime string
      eventDate = event.eventdate.split('T')[0];
    } catch (error) {
      // Fallback: try to parse the full datetime string and extract date
      const parsedDate = new Date(event.eventdate);
      eventDate = parsedDate.toISOString().split('T')[0];
    }
    
    const volunteerAvailability = volunteer.profile?.availability;
    
    if (Array.isArray(volunteerAvailability)) {
      // If availability is an array of dates, check if the event date is in the array
      return volunteerAvailability.some(availableDate => {
        const availableDateStr = availableDate.toString();
        return availableDateStr === eventDate || 
               availableDateStr.includes('any') || 
               availableDateStr.includes('all') || 
               availableDateStr.includes('flexible') ||
               availableDateStr.includes('everyday') ||
               availableDateStr.includes('daily');
      });
    } else if (typeof volunteerAvailability === 'object' && volunteerAvailability !== null) {
      // If availability is an object with date: boolean pairs, check if the specific date is true
      // or if there's a general availability flag
      return volunteerAvailability[eventDate] === true || 
             volunteerAvailability.any === true || 
             volunteerAvailability.all === true ||
             volunteerAvailability.flexible === true ||
             volunteerAvailability.everyday === true ||
             volunteerAvailability.daily === true;
    }
    
    return false;
  };

  // Function to count matching skills between volunteer and event
  const countMatchingSkills = (volunteer, event) => {
    const volunteerSkills = volunteer.profile?.skills || [];
    const eventSkills = Array.isArray(event.requiredskills) ? event.requiredskills : [event.requiredskills];
    return volunteerSkills.filter(skill => eventSkills.includes(skill)).length;
  };

  // Function to check if volunteer and event are matchable (location and date must match)
  const isMatchable = (volunteer, event) => {
    return checkLocationMatch(volunteer, event) && checkDateMatch(volunteer, event);
  };

  // Function to get compatibility status for an event
  const getEventCompatibilityStatus = (event) => {
    if (!selectedVolunteer) return 'neutral';
    return isMatchable(selectedVolunteer, event) ? 'compatible' : 'incompatible';
  };

  // Function to get detailed compatibility information
  const getCompatibilityDetails = (volunteer, event) => {
    if (!volunteer || !event) return '';

    const volunteerSkills = volunteer.profile?.skills || [];
    const eventSkills = Array.isArray(event.requiredskills) ? event.requiredskills : [event.requiredskills];
    const matchingSkills = volunteerSkills.filter(skill => eventSkills.includes(skill));
    const skillMatchCount = matchingSkills.length;
    
    const volunteerCity = volunteer.profile?.city?.toLowerCase() || '';
    const eventLocation = event.location?.toLowerCase() || '';
    const locationCompatible = eventLocation.includes(volunteerCity) || volunteerCity.includes(eventLocation);

    let eventDate;
    try {
      // Extract just the date part from the event datetime string
      eventDate = event.eventdate.split('T')[0];
    } catch (error) {
      // Fallback: try to parse the full datetime string and extract date
      const parsedDate = new Date(event.eventdate);
      eventDate = parsedDate.toISOString().split('T')[0];
    }
    
    let availabilityCompatible = false;
    const volunteerAvailability = volunteer.profile?.availability;
    
    if (Array.isArray(volunteerAvailability)) {
      availabilityCompatible = volunteerAvailability.some(availableDate => {
        const availableDateStr = availableDate.toString();
        return availableDateStr === eventDate || 
               availableDateStr.includes('any') || 
               availableDateStr.includes('all') || 
               availableDateStr.includes('flexible') ||
               availableDateStr.includes('everyday') ||
               availableDateStr.includes('daily');
      });
    } else if (typeof volunteerAvailability === 'object' && volunteerAvailability !== null) {
      availabilityCompatible = volunteerAvailability[eventDate] === true || 
                              volunteerAvailability.any === true || 
                              volunteerAvailability.all === true ||
                              volunteerAvailability.flexible === true ||
                              volunteerAvailability.everyday === true ||
                              volunteerAvailability.daily === true;
    }

    const details = [];
    
    // Location check (MUST match)
    if (!locationCompatible) {
      details.push(`   Location: Volunteer city: "${volunteer.profile?.city}"`);
      details.push(`   Event location: "${event.location}"`);
      details.push(`   Status: Location MUST match - NO MATCH`);
    } else {
      details.push(`   Location: Volunteer city: "${volunteer.profile?.city}"`);
      details.push(`   Event location: "${event.location}"`);
      details.push(`   Status: Location matches ✓`);
    }
    
    // Date check (MUST match)
    if (!availabilityCompatible) {
      details.push(`   Date: Event date: "${eventDate}"`);
      details.push(`   Volunteer availability: ${JSON.stringify(volunteerAvailability)}`);
      details.push(`   Status: At least one date MUST match - NO MATCH`);
    } else {
      details.push(`   Date: Event date: "${eventDate}"`);
      details.push(`   Volunteer availability: ${JSON.stringify(volunteerAvailability)}`);
      details.push(`   Status: Date matches ✓`);
    }
    
    // Skills check (for ordering)
    details.push(`   Skills: Volunteer has: [${volunteerSkills.join(', ')}]`);
    details.push(`   Event needs: [${eventSkills.join(', ')}]`);
    details.push(`   Matching skills: [${matchingSkills.join(', ')}] (${skillMatchCount} matches)`);
    
    // Overall matchability
    if (locationCompatible && availabilityCompatible) {
      details.push(`MATCHABLE: Location ✓ Date ✓ Skills: ${skillMatchCount} matches`);
    } else {
      details.push(`NOT MATCHABLE: Location or Date requirement not met`);
    }

    return details.join('\n');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setVolunteers(volunteerRes.data.volunteers);
        setMatches(volunteerRes.data.matches || []);

        const eventRes = await axios.get('http://localhost:8080/api/events');
        setEvents(eventRes.data.events.filter((e) => e.status !== 'deleted'));
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
      setUser(user || null);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCreateMatch = async () => {
    if (!selectedVolunteer || !selectedEvent) return;

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
        const volunteerRes = await axios.get('http://localhost:8080/api/matching');
        setMatches(volunteerRes.data.matches || []);

        const idToken = await user.getIdToken();

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
          await fetch('http://localhost:8080/api/notifications/send', {
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
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
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

  const indexOfLastVolunteer = currentVolunteerPage * itemsPerPage;
  const indexOfFirstVolunteer = indexOfLastVolunteer - itemsPerPage;
  const paginatedVolunteers = volunteers.slice(indexOfFirstVolunteer, indexOfLastVolunteer);

  // Sort events by new matching criteria when a volunteer is selected
  const sortedEvents = useMemo(() => {
    if (!selectedVolunteer) return events;
    
    return [...events].sort((a, b) => {
      const aMatchable = isMatchable(selectedVolunteer, a);
      const bMatchable = isMatchable(selectedVolunteer, b);
      
      // First, separate matchable from non-matchable
      if (aMatchable && !bMatchable) return -1;
      if (!aMatchable && bMatchable) return 1;
      
      // If both are matchable, sort by skill matches (most matches first)
      if (aMatchable && bMatchable) {
        const aSkillMatches = countMatchingSkills(selectedVolunteer, a);
        const bSkillMatches = countMatchingSkills(selectedVolunteer, b);
        
        // Higher skill matches come first
        if (aSkillMatches > bSkillMatches) return -1;
        if (aSkillMatches < bSkillMatches) return 1;
      }
      
      return 0;
    });
  }, [selectedVolunteer, events]);

  const indexOfLastEvent = currentEventPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const paginatedEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    const totalPagesVolunteers = Math.ceil(volunteers.length / itemsPerPage);
  const totalPagesEvents = Math.ceil(sortedEvents.length / itemsPerPage);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'rgba(138, 154, 91, 0.3)' }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Volunteer Matching
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Volunteer Table */}
        <TableContainer component={Paper} sx={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', height: 600 }}>
          <Typography variant="h6" sx={{ p: 1 }}>
            Volunteers
          </Typography>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                {paginatedVolunteers.map((v) => (
                  <TableRow
                    key={v.uid}
                    hover
                    selected={selectedVolunteer?.uid === v.uid}
                    onClick={() => {
                      const newSelection = selectedVolunteer?.uid === v.uid ? null : v;
                      setSelectedVolunteer(newSelection);
                      // Reset to first page when changing volunteer selection
                      if (newSelection !== selectedVolunteer) {
                        setCurrentEventPage(1);
                      }
                    }}
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
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 1 }}>
            <Button
              variant='contained'
              disabled={currentVolunteerPage === 1}
              onClick={() => setCurrentVolunteerPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>
              Page {currentVolunteerPage} of {totalPagesVolunteers}
            </Typography>
            <Button
              variant='contained'
              disabled={currentVolunteerPage === totalPagesVolunteers}
              onClick={() => setCurrentVolunteerPage(prev => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </TableContainer>

        {/* Events Table */}
        <TableContainer component={Paper} sx={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', height: 600 }}>
          <Typography variant="h6" sx={{ p: 1 }}>
            Events {selectedVolunteer && '(Sorted by Location/Date Match + Skill Count)'}
          </Typography>
          {selectedVolunteer && (
            <Box sx={{ p: 1, display: 'flex', gap: 2, alignItems: 'center', fontSize: '0.875rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#e8f5e8', border: '1px solid #ccc' }}></Box>
                <Typography variant="body2">Matchable (Location + Date ✓)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#ffeaea', border: '1px solid #ccc' }}></Box>
                <Typography variant="body2">Not Matchable (Location or Date ✗)</Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                {paginatedEvents.map((e) => {
                  const compatibilityStatus = getEventCompatibilityStatus(e);
                  const isCompatible = compatibilityStatus === 'compatible';
                  const isIncompatible = compatibilityStatus === 'incompatible';
                  const compatibilityDetails = selectedVolunteer ? getCompatibilityDetails(selectedVolunteer, e) : '';
                  const skillMatchCount = selectedVolunteer ? countMatchingSkills(selectedVolunteer, e) : 0;
                  
                  return (
                    <Tooltip 
                      title={selectedVolunteer ? compatibilityDetails : ''} 
                      placement="left"
                      arrow
                    >
                      <TableRow
                      key={e.eventid}
                      hover
                      selected={selectedEvent?.eventid === e.eventid}
                      onClick={() => setSelectedEvent(selectedEvent?.eventid === e.eventid ? null : e)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedEvent?.eventid === e.eventid 
                          ? '#e0f7fa' 
                          : isCompatible 
                            ? '#e8f5e8' // Light green for compatible
                            : isIncompatible 
                              ? '#ffeaea' // Light red for incompatible
                              : 'inherit',
                        '&:hover': {
                          backgroundColor: selectedEvent?.eventid === e.eventid 
                            ? '#e0f7fa' 
                            : isCompatible 
                              ? '#d4edda' // Darker green on hover
                              : isIncompatible 
                                ? '#f8d7da' // Darker red on hover
                                : '#f5f5f5',
                        }
                      }}
                    >
                    <TableCell>{e.eventid}</TableCell>
                    <TableCell>{e.eventname}</TableCell>
                    <TableCell>{e.eventdescription}</TableCell>
                    <TableCell>{e.location}</TableCell>
                    <TableCell>
                      {Array.isArray(e.requiredskills) ? e.requiredskills.join(', ') : e.requiredskills}
                      {selectedVolunteer && isCompatible && (
                        <Typography variant="caption" display="block" sx={{ color: 'green', fontWeight: 'bold' }}>
                          {skillMatchCount} skill(s) match
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{e.urgency}</TableCell>
                    <TableCell>{e.eventdate}</TableCell>
                  </TableRow>
                    </Tooltip>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 1 }}>
            <Button
              variant='contained'
              disabled={currentEventPage === 1}
              onClick={() => setCurrentEventPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>
              Page {currentEventPage} of {totalPagesEvents}
            </Typography>
            <Button
              variant='contained'
              disabled={currentEventPage === totalPagesEvents}
              onClick={() => setCurrentEventPage(prev => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </TableContainer>
      </Box>

      {/* Match Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleCreateMatch}
          disabled={!selectedVolunteer || !selectedEvent}
        >
          Create Match
        </Button>
      </Box>

      {/* Existing Matches */}

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
