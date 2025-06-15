import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Paper, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';

const MatchPage = () => {
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [matches, setMatches] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hardcoded volunteer and event data
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
    }, []);

    // Get suggested events for the selected volunteer
    const getSuggestedEvents = (volunteerEmail) => {
        const volunteer = volunteers.find(v => v.email === volunteerEmail);
        if (!volunteer) return [];
        return events.filter(event =>
            event.skills.some(skill => volunteer.profile.skills.includes(skill))
        );
    };

    // Group matches by event for display
    const groupedMatches = matches.reduce((acc, match) => {
        const event = events.find(e => e.id === match.eventId);
        if (!event) return acc;
        const existing = acc.find(item => item.eventId === match.eventId);
        const volunteer = volunteers.find(v => v.email === match.volunteerEmail);
        if (existing) {
            existing.volunteerNames.push(volunteer?.profile.fullName || 'Unknown Volunteer');
            existing.matchIds.push(match.id);
        } else {
            acc.push({
                eventId: match.eventId,
                eventName: event.name,
                eventDate: event.date,
                volunteerNames: [volunteer?.profile.fullName || 'Unknown Volunteer'],
                matchIds: [match.id]
            });
        }
        return acc;
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!selectedVolunteer) {
            setError('Please select a volunteer.');
            setLoading(false);
            return;
        }
        if (!selectedEvent) {
            setError('Please select an event.');
            setLoading(false);
            return;
        }

        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            const existingMatch = localData.matches.find(
                m => m.volunteerEmail === selectedVolunteer && m.eventId === selectedEvent
            );
            if (existingMatch) {
                setError('This volunteer is already matched to this event.');
                setLoading(false);
                return;
            }

            const newMatch = {
                id: Date.now(),
                volunteerEmail: selectedVolunteer,
                eventId: selectedEvent
            };
            localData.matches = [...localData.matches, newMatch];
            localStorage.setItem('appData', JSON.stringify(localData));
            setMatches(localData.matches);
            setSelectedVolunteer('');
            setSelectedEvent('');
            setLoading(false);
        } catch (err) {
            setError('Failed to create match: ' + err.message);
            setLoading(false);
        }
    };

    const handleRemoveMatch = (matchId) => {
        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            const updatedMatches = localData.matches.filter(m => m.id !== matchId);
            localData.matches = updatedMatches;
            localStorage.setItem('appData', JSON.stringify(localData));
            setMatches(updatedMatches);
        } catch (err) {
            setError('Failed to remove match: ' + err.message);
        }
    };

    const handleRemoveVolunteerFromEvent = (eventId, volunteerName) => {
        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { matches: [] };
            const volunteer = volunteers.find(v => v.profile.fullName === volunteerName);
            if (!volunteer) throw new Error('Volunteer not found');
            const matchToRemove = localData.matches.find(
                m => m.eventId === eventId && m.volunteerEmail === volunteer.email
            );
            if (!matchToRemove) throw new Error('Match not found');
            const updatedMatches = localData.matches.filter(m => m.id !== matchToRemove.id);
            localData.matches = updatedMatches;
            localStorage.setItem('appData', JSON.stringify(localData));
            setMatches(updatedMatches);
        } catch (err) {
            setError('Failed to remove volunteer from event: ' + err.message);
        }
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
                Volunteer Matching
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Volunteer Name</InputLabel>
                    <Select
                        name="volunteer"
                        value={selectedVolunteer}
                        onChange={(e) => {
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
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Matched Event</InputLabel>
                    <Select
                        name="event"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        label="Matched Event"
                        disabled={!selectedVolunteer}
                    >
                        <MenuItem value="">Select event</MenuItem>
                        {getSuggestedEvents(selectedVolunteer).map(event => (
                            <MenuItem key={event.id} value={event.id}>
                                {event.name} ({event.date})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Existing Matches
            </Typography>
            {groupedMatches.length === 0 ? (
                <Typography>No matches created yet.</Typography>
            ) : (
                <Paper sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <List dense>
                        {groupedMatches.map((group, index) => (
                            <React.Fragment key={group.eventId}>
                                <ListItem
                                    secondaryAction={
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
                                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                                {group.volunteerNames.map((name, idx) => (
                                                    <Box component="li" key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {name}
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