import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, Alert, Checkbox } from '@mui/material';


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


    // Hardcoded skills and urgency options for the demo
    const availableSkills = ['First Aid', 'Event Planning', 'Teamwork', 'Communication', 'Logistics'];
    const urgencyOptions = ['Low', 'Medium', 'High'];

    // Hardcoded demo events
    const demoEvents = [
        {
            id: 1,
            name: 'Community Cleanup',
            description: 'A neighborhood cleanup event to promote environmental awareness.',
            location: 'Central Park',
            skills: ['Teamwork', 'Logistics'],
            urgency: 'Medium',
            date: '2025-07-01'
        },
        {
            id: 2,
            name: 'First Aid Workshop',
            description: 'Learn basic first aid skills to assist in emergencies.',
            location: 'Community Center',
            skills: ['First Aid', 'Communication'],
            urgency: 'High',
            date: '2025-07-15'
        }
    ];

    // Load demo events and merge with localStorage
    useEffect(() => {
        //set loading state to true while fetching data
        setLoading(true);
        try {
            // parse localStorage data or initialize with empty arrays
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            // merge demo events with localStorage events, avoiding duplicates
            const mergedEvents = [
                ...demoEvents,
                ...localData.events.filter(le => !demoEvents.some(de => de.id === le.id))
            ];
            // update the state with merged events
            setEvents(mergedEvents);
            //reset form data for new event creation
            setLoading(false);
        } catch (err) {
            setError('Unexpected error loading data.');
            setLoading(false);
        }
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
    const handleSubmit = (e) => {
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
            // get localStorage data or initialize with empty arrays
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            let updatedEvents;

            if (formData.id) {
                // update existing event
                updatedEvents = localData.events.map(event =>
                    event.id === formData.id ? { ...formData } : event
                );
            } else {
                // create new event with a unique ID based on current timestamp
                const newEvent = {
                    ...formData,
                    id: Date.now() // use timestamp as a unique ID
                };
                updatedEvents = [...localData.events, newEvent];
            }
            // update localStorage with the new or updated events
            localData.events = updatedEvents;
            localStorage.setItem('appData', JSON.stringify(localData));
            // update the state with the new or updated events
            setEvents(updatedEvents);
            // reset form data for new event creation
            setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
            // reset error message and loading state
            setLoading(false);
        } catch (err) {
            setError('Failed to save event: ' + err.message);
            setLoading(false);
        }
    };
    // Handle erroes during form submission, editing, and deletion
    const handleEdit = (event) => {
        // populate the form with the selected event data for editing
        setFormData(event);
        // reset error message when editing an event
        setError('');
    };

    const handleDelete = (id) => {
        try {
            // load localStorage data or initialize with empty arrays
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            // filter out the event to be deleted
            const updatedEvents = localData.events.filter(event => event.id !== id);
            // update localStorage with the remaining events
            localData.events = updatedEvents;
            localStorage.setItem('appData', JSON.stringify(localData));
            // update the state with the remaining events
            setEvents(updatedEvents);
        } catch (err) {
            setError('Failed to delete event: ' + err.message);
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
                    color="primary"
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
                            <React.Fragment key={event.id}>
                                {/* ListItem for each event with edit and delete actions */}
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            {/* Edit and Delete buttons for each event */}
                                            <Button
                                                variant="outlined"
                                                color="primary"
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
                                                onClick={() => handleDelete(event.id)}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={event.name}
                                        secondary={`Date: ${event.date} | Skills: ${event.skills.join(', ')}`}
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