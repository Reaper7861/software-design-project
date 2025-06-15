import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, Alert, Checkbox } from '@mui/material';

const EventManagement = () => {
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: '',
        location: '',
        skills: [],
        urgency: '',
        date: ''
    });
    const [error, setError] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            const mergedEvents = [
                ...demoEvents,
                ...localData.events.filter(le => !demoEvents.some(de => de.id === le.id))
            ];
            setEvents(mergedEvents);
            setLoading(false);
        } catch (err) {
            setError('Unexpected error loading data.');
            setLoading(false);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            skills: typeof value === 'string' ? value.split(',') : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.name || formData.name.length > 100) {
            setError('Event Name is required and must be 100 characters or less.');
            setLoading(false);
            return;
        }
        if (!formData.description) {
            setError('Event Description is required.');
            setLoading(false);
            return;
        }
        if (!formData.location) {
            setError('Location is required.');
            setLoading(false);
            return;
        }
        if (formData.skills.length === 0) {
            setError('At least one skill is required.');
            setLoading(false);
            return;
        }
        if (!formData.urgency) {
            setError('Urgency selection is required.');
            setLoading(false);
            return;
        }
        if (!formData.date) {
            setError('Event Date is required.');
            setLoading(false);
            return;
        }

        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            let updatedEvents;

            if (formData.id) {
                updatedEvents = localData.events.map(event =>
                    event.id === formData.id ? { ...formData } : event
                );
            } else {
                const newEvent = {
                    ...formData,
                    id: Date.now()
                };
                updatedEvents = [...localData.events, newEvent];
            }

            localData.events = updatedEvents;
            localStorage.setItem('appData', JSON.stringify(localData));
            setEvents(updatedEvents);
            setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
            setLoading(false);
        } catch (err) {
            setError('Failed to save event: ' + err.message);
            setLoading(false);
        }
    };

    const handleEdit = (event) => {
        setFormData(event);
        setError('');
    };

    const handleDelete = (id) => {
        try {
            const localData = JSON.parse(localStorage.getItem('appData')) || { events: [], users: [], matches: [] };
            const updatedEvents = localData.events.filter(event => event.id !== id);
            localData.events = updatedEvents;
            localStorage.setItem('appData', JSON.stringify(localData));
            setEvents(updatedEvents);
        } catch (err) {
            setError('Failed to delete event: ' + err.message);
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
                Event Management
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Event Name (100 characters)"
                    fullWidth
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 100 }}
                    required
                />
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
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => handleEdit(event)}
                                                sx={{ mr: 1 }}
                                            >
                                                Edit
                                            </Button>
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
                                {index < events.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default EventManagement;