import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

const MatchPage = () => {
    // Hardcoded volutneers list
    const [volunteers, setVolunteers] = useState([
    {
        uid: "volunteer1",
        fullName: "Jane Doe",
        address: "123 Street",
        city: "Houston",
        state: "TX",
        zip: "77000",
        skills: ["First Aid", "Teamwork"],
        preferences: "I like to work with a team",
        availability: ["2025-01-01", "2025-01-02"]
    },
    {
        uid: "volunteer2",
        fullName: "John Smith",
        address: "456 Somewhere Avenue",
        city: "Houston",
        state: "TX",
        zip: "77001",
        skills: ["Event Planning", "Communication"],
        preferences: "I like to work indoors",
        availability: ["2025-02-01", "2025-02-02"]
    }
    ]);

    // Hardcoded events list
    const [events, setEvents] = useState([
    {
        id: "1",
        name: "Food Drive",
        description: "Collect and distribute food",
        location: "Downtown",
        requiredSkills: ["Organization", "Teamwork"],
        urgency: "High",
        date: "2025-05-05"
    },
    {
        id: "2",
        name: "Community Cleanup",
        description: "Cleanup neighborhood",
        location: "Happy Village Homes",
        requiredSkills: ["Cleaning", "Teamwork", "Communication"],
        urgency: "Medium",
        date: "2025-04-01"
    }

    ]);


    const [selectedVolunteer, setSelectedVolunteer] = useState(null); // for storing seclected volunteer 
    const [selectedEvent, setSelectedEvent] = useState(null); // for storing selected event 
    const [matches, setMatches] = useState([]); // for storing matched volunteers with events


    // Load matches on page load
    useEffect(() => {
        const stored = localStorage.getItem("matches");
        
        if(stored) {
            setMatches(JSON.parse(stored));
        }
    }, []); // empty dependency array 

    // Save matches
    const saveMatches = (updated) => {
        setMatches(updated);
        localStorage.setItem("matches", JSON.stringify(updated));
    };

    // Create new match
    const handleCreateMatch = () => {
        if(!selectedVolunteer || !selectedEvent) return;

        // Check if match already exists
        const exists = matches.some(
            (m) => 
                m.volunteer.uid === selectedVolunteer.uid &&
                m.event.id === selectedEvent.id
        );

        if(exists) {
            alert("This volunteer is already assigned to this event.");
            return;
        }


        const newMatch = {
            volunteer: selectedVolunteer,
            event: selectedEvent
        };

        const updated = [...matches, newMatch];
        saveMatches(updated);

        // Clear
        setSelectedVolunteer(null);
        setSelectedEvent(null);
    };


    // Remove existing match
    const handleRemoveMatch = (index) => {
        const updated = matches.filter((_, i) => i !== index);
        saveMatches(updated);
    };


    // render component UI
    return (
        <Box sx = {{p: 3}}>
            {/* Page title */}
            <Typography variant = "h5" gutterBottom sx ={{color: "white"}}>
                Volunteer Matching
            </Typography>

            {/* Volunter Table */}
            <Box sx = {{display: "flex", gap: 2, flexWrap: "wrap"}}>
                <TableContainer component = {Paper} sx = {{flex: "1 1 500px"}}>
                    <Typography variant = "h6" sx = {{p: 1}}>
                        Volunteers
                    </Typography>
                    <Table>
                        <TableHead>
                            {/* Volunteer table headers */}
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
                            {/* Volunteer rows */}
                            {volunteers.map((v) => (
                                <TableRow
                                key={v.uid}
                                hover
                                selected = {selectedVolunteer?.uid === v.uid}
                                onClick = {() => 
                                    setSelectedVolunteer(
                                        selectedVolunteer?.uid === v.uid ? null : v
                                    )
                                }
                                sx = {{
                                    cursor: "pointer",
                                    backgroundColor: 
                                    selectedVolunteer?.uid === v.uid ? "#e0f7fa": "inherit"
                                }}
                                >
                                    <TableCell>{v.fullName}</TableCell>
                                    <TableCell>{v.address}</TableCell>
                                    <TableCell>{v.city}</TableCell>
                                    <TableCell>{v.state}</TableCell>
                                    <TableCell>{v.zip}</TableCell>
                                    <TableCell>{v.skills.join(", ")}</TableCell>
                                    <TableCell>{v.preferences}</TableCell>
                                    <TableCell>{v.availability.join(", ")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Event Table */}
                <TableContainer component = {Paper} sx = {{flex: "1 1 500px"}}>
                    <Typography variant = "h6" sx = {{p: 1}}>
                        Events
                    </Typography>
                    <Table>
                        <TableHead>
                            {/* Event table headers */}
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Required Skills</TableCell>
                                <TableCell>Urgency</TableCell>
                                <TableCell>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Event rows */}
                            {events.map((e) => (
                                <TableRow
                                key = {e.id}
                                hover
                                selected = {selectedEvent?.id === e.id}
                                onClick = {() => 
                                    setSelectedEvent(selectedEvent?.id === e.id ? null : e)
                                }
                                sx = {{
                                    cursor: "pointer",
                                    backgroundColor: 
                                    selectedEvent?.id === e.id ? "#e0f7fa": "inherit"
                                }}
                                >
                                    <TableCell>{e.name}</TableCell>
                                    <TableCell>{e.description}</TableCell>
                                    <TableCell>{e.location}</TableCell>
                                    <TableCell>{e.requiredSkills}</TableCell>
                                    <TableCell>{e.urgency}</TableCell>
                                    <TableCell>{e.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Match button */}
            <Box sx = {{mt: 2}}>
                <Button
                    variant = "contained"
                    disabled = {!selectedVolunteer || !selectedEvent}
                    onClick = {handleCreateMatch}
                >
                    Create Match
                </Button>
            </Box>

            {/* Existing Match Tables */}
            <Box sx = {{mt: 3}}>
                <Typography variant = "h6" sx = {{color: "white"}}>Existing Matches</Typography>
                {matches.length === 0 ? (
                    <Typography>No matches made yet.</Typography>
                ): (
                    <TableContainer component = {Paper}>
                        <Table>
                            <TableHead>
                                {/* Matches table headers */}
                                <TableRow>
                                    <TableCell>Volunteer</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Matches rows */}
                                {matches.map((m, index) => (
                                    <TableRow key = {index}>
                                        <TableCell>{m.volunteer.fullName}</TableCell>
                                        <TableCell>{m.event.name}</TableCell>
                                        <TableCell>
                                            <Button
                                            color = "error"
                                            onClick = {() => handleRemoveMatch(index)}
                                            >
                                                Remove
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