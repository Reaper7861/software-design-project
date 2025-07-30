import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, Alert, Checkbox } from '@mui/material';
import axios from 'axios';


// define the event management component for creating, editing, and deleting events
const EventManagement = () => {
    // State variables for form data, error messages, events list, and loading state
    const [formData, setFormData] = useState({
        id: null, // Null for new events, or the event ID for editing
        name: '',
        description: '',
        location: '',
        skills: [], // Array of selected skills
        urgency: '',
        date: ''
    });
    // state to display error messages, events list, and loading state
    const [error, setError] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');


    // Hardcoded skills and urgency options for the demo
    const availableSkills = ['First Aid', 'Event Planning', 'Teamwork', 'Communication', 'Logistics'];
    const urgencyOptions = ['Low', 'Medium', 'High'];

    // Load demo events and merge with localStorage
    // Hardcoded demo events
    useEffect(() => {
        const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8080/api/events');
            const activeEvents = (res.data.events || []).filter(e => e.status !== 'deleted');
            setEvents(activeEvents);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load events from server.');
            setLoading(false);
        }
    };

    fetchEvents();
    }, []); // empty dependency array to run only once on mount

    // Handlers for form input changes, submission, editing, and deletion
    const handleChange = (e) => {
        //extract name and value from the event target
        const { name, value } = e.target;
        // update the form data state with the new value
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for skills selection change
    const handleSkillsChange = (e) => {
        // extract formdata skills from the event target
        const { value } = e.target;
        // update form data state with selected skills
        setFormData(prev => ({
            ...prev,
            skills: typeof value === 'string' ? value.split(',') : value
        }));
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        // prevent default form submission behavior
        e.preventDefault();
        // reset error message and set loading state
        setError('');
        // validate form data before proceeding
        setLoading(true);

        // validate event form data
        if (!formData.name || formData.name.length > 100) {
            setError('Event Name is required and must be 100 characters or less.');
            setLoading(false);
            return;
        }
        // validate event description
        if (!formData.description) {
            setError('Event Description is required.');
            setLoading(false);
            return;
        }
        // validate event location
        if (!formData.location) {
            setError('Location is required.');
            setLoading(false);
            return;
        }
        // validate selected skills
        if (formData.skills.length === 0) {
            setError('At least one skill is required.');
            setLoading(false);
            return;
        }
        // validate urgency selection
        if (!formData.urgency) {
            setError('Urgency selection is required.');
            setLoading(false);
            return;
        }
        // validate event date
        if (!formData.date) {
            setError('Event Date is required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                eventname: formData.name,
                eventdescription: formData.description,
                location: formData.location,
                requiredskills: formData.skills, // always an array
                urgency: formData.urgency,
                eventdate: formData.date
            };

            if (formData.id) {
                // Update existing event
                const res = await axios.put(`http://localhost:8080/api/events/${formData.id}`, payload);
                setEvents(prev =>
                    prev.map(e => e.eventid === formData.id ? res.data.event : e)
                );
            } else {
                // Create new event
                const res = await axios.post('http://localhost:8080/api/events', payload);
                setEvents(prev => [...prev, res.data.event]);
            }
            setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });

            setSuccessMsg(formData.id ? 'Event updated successfully!' : 'Event created successfully!');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            console.error(err);
            setError('Failed to save event.');
        } finally {
            setLoading(false);
        }
    };
    // Handle erroes during form submission, editing, and deletion
    const handleEdit = (event) => {
        setFormData({
            id: event.eventid,
            name: event.eventname,
            description: event.eventdescription,
            location: event.location,
            skills: event.requiredskills,
            urgency: event.urgency,
            // Convert ISO string to YYYY-MM-DD for the date input
            date: event.eventdate ? event.eventdate.slice(0, 10) : ''
        });
        setError('');
    };

    const handleDelete = async (eventId) => {
        try {
            await axios.delete(`http://localhost:8080/api/events/${eventId}`);
            setEvents(prev => prev.filter(e => e.eventid !== eventId));
        } catch (err) {
            console.error(err);
            setError('Failed to delete event.');
        }
    };
    // Render the event management form and existing events list
    return (
        // Main container for the event management page
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
            {/* Title of the event management page */}
            <Typography variant="h5" gutterBottom>
                Event Management
            </Typography>

            {/* Display success message if any */}
            {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
                {successMsg}
            </Alert>
            )}

            {/* Display error messages if any */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {/* Form for creating or editing events */}
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Event Name (100 characters)"
                    fullWidth
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 100 }} // deprecated, but still might work added a different one below 
                    slotProps={{
                        htmlInput: {
                            maxLength: 100 // Limit input to 100 characters
                        }
                    }}
                    required
                />
                {/* Description field for the event */}
                <TextField
                    label="Event Description"
                    fullWidth
                    multiline
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                />
                {/* Location field for the event */}
                <TextField
                    label="Location"
                    fullWidth
                    multiline
                    rows={2}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                />
                {/* FormControl for selecting required skills */}
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Required Skills</InputLabel>
                    <Select
                        multiple
                        name="skills"
                        value={formData.skills}
                        onChange={handleSkillsChange}
                        label="Required Skills"
                        renderValue={(selected) => selected.join(', ')}
                    >
                        {availableSkills.map(skill => (
                            <MenuItem key={skill} value={skill}>
                                <Checkbox checked={formData.skills.includes(skill)} />
                                <ListItemText primary={skill} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {/* FormControl for selecting urgency level */}
                <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Urgency</InputLabel>
                    <Select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        label="Urgency"
                    >
                        <MenuItem value="">Select urgency</MenuItem>
                        {urgencyOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {/* FormControl for selecting event date */}
                <TextField
                    label="Event Date"
                    type="date"
                    fullWidth
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                    required
                />
                {/* Submit button for creating or updating events */}
                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    type="submit"
                    disabled={loading}
                    sx={{ mb: 2 }}
                >
                    {loading ? 'Saving...' : formData.id ? 'Update Event' : 'Create Event'}
                </Button>
            </Box>
            {/* Section for displaying existing events */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Existing Events
            </Typography>
            {events.length === 0 ? (
                <Typography>No events created yet.</Typography>
            ) : (
                <Paper sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <List dense>
                        {events.map((event, index) => (
                            <React.Fragment key={event.eventid}>
                                {/* ListItem for each event with edit and delete actions */}
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            {/* Edit and Delete buttons for each event */}
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                onClick={() => handleEdit(event)}
                                                sx={{ mr: 1 }}
                                            >
                                                Edit
                                            </Button>
                                            {/* Divider between Edit and Delete buttons */}
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDelete(event.eventid)}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={event.eventname}
                                        secondary={`Date: ${event.eventdate} | Skills: ${(Array.isArray(event.requiredskills) ? event.requiredskills : typeof event.requiredskills === 'string' ? [event.requiredskills] : []).join(', ') || 'None'}`}
                                    />
                                </ListItem>
                                {/* Divider between events */}
                                {index < events.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};
// Export the EventManagement component as default for use in other parts of the application
export default EventManagement;