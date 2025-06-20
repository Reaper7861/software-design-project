import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Paper, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';

const MatchPage = () => {
    const [selectedVolunteer, setSelectedVolunteer] = useState(''); // for storing seclected volunteer email
    const [selectedEvent, setSelectedEvent] = useState(''); // for storing selected event id
    const [matches, setMatches] = useState([]); // for storing matched volunteers with events
    const [error, setError] = useState(''); // for displaying error messages to user
    const [loading, setLoading] = useState(false); // for indicating loading state

    // Hardcoded volunteer and event data email, name and skills 
    const volunteers = [
        {
            email: 'jane.doe@example.com',
            profile: {
                fullName: 'Jane Doe',
                skills: ['First Aid', 'Teamwork']
            }
        },
        {
            email: 'john.smith@example.com',
            profile: {
                fullName: 'John Smith',
                skills: ['Event Planning', 'Communication']
            }
        },
        {
            email: 'ava.chen@example.com',
            profile: {
                fullName: 'Ava Chen',
                skills: ['Logistics', 'Communication']
            }
        }
    ];

    // hardcoded events with id, name, required skills and date
    const events = [
        {
            id: 1,
            name: 'Community Cleanup',
            skills: ['Teamwork', 'Logistics'],
            date: '2025-07-01'
        },
        {
            id: 2,
            name: 'First Aid Workshop',
            skills: ['First Aid', 'Communication'],
            date: '2025-07-15'
        },
        {
            id: 3,
            name: 'Charity Run',
            skills: ['Event Planning', 'Teamwork'],
            date: '2025-08-01'
        }
    ];

    // Load matches from localStorage
    useEffect(() => {
        setLoading(true);
        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            setMatches(localData.matches || []);
            setLoading(false);
        } catch (err) {
            setError('Unexpected error loading data.');
            setLoading(false);
        }
    }, []); // empty dependency array to run only once on mount

    // Get suggested events for the selected volunteer based on their skills
    const getSuggestedEvents = (volunteerEmail) => {
        // fiind volunteer by email
        const volunteer = volunteers.find(v => v.email === volunteerEmail);
        // return empty array if no volunteer found 
        if (!volunteer) return [];
        // filter events that match volunteer skills at least one skill
        return events.filter(event =>
            event.skills.some(skill => volunteer.profile.skills.includes(skill))
        );
    };

    // Group matches by event for display
    const groupedMatches = matches.reduce((acc, match) => {
        //find the event event associated with the match
        const event = events.find(e => e.id === match.eventId);
        // skip if event not found
        if (!event) return acc;
        // check if event already exists in accumulator
        const existing = acc.find(item => item.eventId === match.eventId);
        // find volunteer associated with the match
        const volunteer = volunteers.find(v => v.email === match.volunteerEmail);
        if (existing) {
            // add volunteer name and match id to existing event group
            existing.volunteerNames.push(volunteer?.profile.fullName || 'Unknown Volunteer');
            existing.matchIds.push(match.id);
        } else {
            // create new event group with volunteer name and match details
            acc.push({
                eventId: match.eventId,
                eventName: event.name,
                eventDate: event.date,
                volunteerNames: [volunteer?.profile.fullName || 'Unknown Volunteer'],
                matchIds: [match.id]
            });
        }
        return acc;
    }, []); // initialize accumulator as empty array

    // handle form submission to create a new match
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // validate volunteer selections
        if (!selectedVolunteer) {
            setError('Please select a volunteer.');
            setLoading(false);
            return;
        }
        // validate event selection
        if (!selectedEvent) {
            setError('Please select an event.');
            setLoading(false);
            return;
        }

        try {
            // load existing data from localStorage
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            // check for existing match to prevent duplicates
            const existingMatch = localData.matches.find(
                m => m.volunteerEmail === selectedVolunteer && m.eventId === selectedEvent
            );
            if (existingMatch) {
                setError('This volunteer is already matched to this event.');
                setLoading(false);
                return;
            }

            // create new match object
            const newMatch = {
                id: Date.now(),
                volunteerEmail: selectedVolunteer,
                eventId: selectedEvent
            };

            // update local data and save to localStorage
            localData.matches = [...localData.matches, newMatch];
            localStorage.setItem('appData', JSON.stringify(localData));

            // update state with new matches and reset selections
            setMatches(localData.matches);
            //reset form fields
            setSelectedVolunteer('');
            setSelectedEvent('');
            //reset loading state
            setLoading(false);
        } catch (err) {
            // handle error
            setError('Failed to create match: ' + err.message);
            setLoading(false);
        }
    };
    // function to handle removing a match by its id    
    const handleRemoveMatch = (matchId) => {
        try {
            // load existing data from localStorage
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            // filter out the match to be removed
            const updatedMatches = localData.matches.filter(m => m.id !== matchId);
            localData.matches = updatedMatches;
            // save updated data back to localStorage
            localStorage.setItem('appData', JSON.stringify(localData));
            // update state with updated matches
            setMatches(updatedMatches);
        } catch (err) {
            // handle error duriing removal
            setError('Failed to remove match: ' + err.message);
        }
    };

    // function to remove a volunteer from a specific event
    const handleRemoveVolunteerFromEvent = (eventId, volunteerName) => {
        try {
            // load existing data from localStorage
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            // find volunteer by name
            const volunteer = volunteers.find(v => v.profile.fullName === volunteerName);
            if (!volunteer) throw new Error('Volunteer not found');
            // find the match to be removed based on eventId and volunteer email
            const matchToRemove = localData.matches.find(
                m => m.eventId === eventId && m.volunteerEmail === volunteer.email
            );
            if (!matchToRemove) throw new Error('Match not found');
            // filter out the match to be removed
            const updatedMatches = localData.matches.filter(m => m.id !== matchToRemove.id);
            // update local data and save to localStorage
            localData.matches = updatedMatches;
            localStorage.setItem('appData', JSON.stringify(localData));
            // update state with updated matches
            setMatches(updatedMatches);
        } catch (err) {
            // handle error during removal
            setError('Failed to remove volunteer from event: ' + err.message);
        }
    };

    // render component UI
    return (
        // main container with styling for centering layout
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
            {/* Page title */}
            <Typography variant="h5" gutterBottom>
                Volunteer Matching
            </Typography>


            {/* Display error message if exists */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {/* Form for selecting volunteer and event */}
            <Box component="form" onSubmit={handleSubmit}>

                {/* Volunteer selection dropdown */}
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Volunteer Name</InputLabel>
                    <Select
                        name="volunteer"
                        value={selectedVolunteer}
                        onChange={(e) => {
                            // update selected volunteer and reset selected event on change
                            setSelectedVolunteer(e.target.value);
                            setSelectedEvent('');
                        }}
                        label="Volunteer Name"
                    >
                        <MenuItem value="">Select volunteer</MenuItem>
                        {volunteers.map(volunteer => (
                            <MenuItem key={volunteer.email} value={volunteer.email}>
                                {volunteer.profile.fullName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Event selection dropdown, disabled until a volunteer is selected */}
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Matched Event</InputLabel>
                    <Select
                        name="event"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        label="Matched Event"
                        disabled={!selectedVolunteer} // disable if no volunteer selected
                    >
                        <MenuItem value="">Select event</MenuItem>
                        {getSuggestedEvents(selectedVolunteer).map(event => (
                            <MenuItem key={event.id} value={event.id}>
                                {event.name} ({event.date})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {/* Submit button to create match */}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    type="submit"
                    disabled={loading}
                    sx={{ mb: 2 }}
                >
                    {loading ? 'Saving...' : 'Create Match'}
                </Button>
            </Box> 

            {/* Section to display existing matches */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Existing Matches
            </Typography>

            {groupedMatches.length === 0 ? (
                //display message if no matches exist
                <Typography>No matches created yet.</Typography>
            ) : (
                // List of matches grouped by event
                <Paper sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <List dense>
                        {groupedMatches.map((group, index) => (
                            <React.Fragment key={group.eventId}>
                                {/* List item for each event group with volunteer names and remove buttons */}
                                <ListItem
                                    secondaryAction={
                                        // Button to remove all volunteers from the event
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => {
                                                group.matchIds.forEach(matchId => handleRemoveMatch(matchId));
                                            }}
                                        >
                                            Remove All
                                        </Button>
                                    }
                                >
                                    <ListItemText
                                        primary={`${group.eventName} (${group.eventDate})`}
                                        secondary={
                                            // List volunteers for this event
                                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                                {group.volunteerNames.map((name, idx) => (
                                                    <Box component="li" key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {name}
                                                        {/* Button to remove individual volunteer from the event */}
                                                        <Button
                                                            variant="text"
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleRemoveVolunteerFromEvent(group.eventId, name)}
                                                            sx={{ ml: 1, minWidth: 'auto' }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Box>
                                                ))}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {/* Divider between event groups */}
                                {index < groupedMatches.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default MatchPage;