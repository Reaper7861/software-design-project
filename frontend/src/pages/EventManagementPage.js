import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from '@mui/material';
import axios from 'axios';
import '../css/ReportingPage.css';


const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    location: '',
    skills: [],
    urgency: '',
    date: ''
  });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const itemsPerPage = 5;

  const availableSkills = [
    'Communication',
    'Teamwork', 
    'Leadership',
    'Event Planning',
    'Fundraising',
    'Public Speaking',
    'Teaching/Tutoring',
    'Childcare',
    'Elderly Support',
    'Community Outreach'
  ];
  const urgencyOptions = ['Low', 'Medium', 'High'];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:8080/api/events');
        setEvents(res.data.events || []);
      } catch (err) {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      skills: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const hasFormChanged = () => {
    // If we're creating a new event (no id), check if any fields have been filled
    if (!formData.id) {
      return Object.values(formData).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== ''
      );
    }
    
    // If we're editing an event but don't have original data yet, no changes have been made
    if (!originalFormData) return false;
    
    // Compare current form data with original data
    const keys = Object.keys(formData);
    for (const key of keys) {
      if (key === 'skills') {
        const sortedOriginal = [...originalFormData.skills].sort();
        const sortedCurrent = [...formData.skills].sort();
        if (JSON.stringify(sortedOriginal) !== JSON.stringify(sortedCurrent)) {
          return true;
        }
      } else if (formData[key] !== originalFormData[key]) {
        return true;
      }
    }
    return false;
  };



  const handleSubmit = async (e) => {
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
      const payload = {
        eventname: formData.name,
        eventdescription: formData.description,
        location: formData.location,
        requiredskills: formData.skills,
        urgency: formData.urgency,
        eventdate: formData.date
      };

      if (formData.id) {
        const res = await axios.put(`http://localhost:8080/api/events/${formData.id}`, payload);
        const updatedEvent = res.data.event;
        setEvents(prev => prev.map(e => e.eventid === updatedEvent.eventid ? updatedEvent : e));
        const updatedFormData = {
          id: updatedEvent.eventid,
          name: updatedEvent.eventname,
          description: updatedEvent.eventdescription,
          location: updatedEvent.location,
          skills: updatedEvent.requiredskills || [],
          urgency: updatedEvent.urgency,
          date: updatedEvent.eventdate ? updatedEvent.eventdate.split('T')[0] : ''
        };
        setFormData(updatedFormData);
        setOriginalFormData(updatedFormData); // Update original data after save
      } else {
        const res = await axios.post('http://localhost:8080/api/events', payload);
        const newEvent = res.data.event;
        setEvents(prev => [...prev, newEvent]);
        setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
        setSelectedEventId(null);
        setOriginalFormData(null);
      }
    } catch (err) {
      setError('Failed to save event.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    const eventData = {
      id: event.eventid,
      name: event.eventname,
      description: event.eventdescription,
      location: event.location,
      skills: event.requiredskills || [],
      urgency: event.urgency,
      date: event.eventdate ? event.eventdate.split('T')[0] : ''
    };
    
    // Only show confirmation if we're currently editing a different event with unsaved changes
    if (selectedEventId && selectedEventId !== event.eventid && hasFormChanged()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setFormData(eventData);
        setOriginalFormData(eventData);
        setSelectedEventId(event.eventid);
        setError('');
      }
    } else {
      // No unsaved changes or same event, proceed directly
      setFormData(eventData);
      setOriginalFormData(eventData);
      setSelectedEventId(event.eventid);
      setError('');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:8080/api/events/${eventId}`);
        setEvents(prev => prev.filter(e => e.eventid !== eventId));
        if (selectedEventId === eventId) {
          setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
          setSelectedEventId(null);
          setOriginalFormData(null);
        }
      } catch (err) {
        setError('Failed to delete event.');
      }
    }
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'rgba(138, 154, 91, 0.3)' }}>
  <div className='any-container'>
    <Typography variant='h1' textAlign={'center'}>Event Management</Typography>
    <Box sx={{ display: 'flex', p: 1, gap: 2 }}>
      {/* Left: Form */}
      <Paper sx={{ flex: 1, p: 2, minHeight: 600 }}>
        <Typography variant="h4" gutterBottom>{formData.id ? 'Edit Event' : 'Create Event'}</Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Event Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel shrink={formData.skills.length > 0}>Skills</InputLabel>
            <Select
              multiple
              value={formData.skills}
              onChange={handleSkillsChange}
              renderValue={(selected) => selected.join(', ')}
            >
              {availableSkills.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  <Checkbox checked={formData.skills.indexOf(skill) > -1} />
                  <ListItemText primary={skill} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel shrink={!!formData.urgency}>Urgency</InputLabel>
            <Select
              value={formData.urgency}
              onChange={handleChange}
              name="urgency"
            >
              {urgencyOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
            {formData.id ? 'Update Event' : 'Create Event'}
          </Button>
          {formData.id && (
            <Button 
              onClick={() => {
                if (hasFormChanged()) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                    setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
                    setSelectedEventId(null);
                    setOriginalFormData(null);
                  }
                } else {
                  setFormData({ id: null, name: '', description: '', location: '', skills: [], urgency: '', date: '' });
                  setSelectedEventId(null);
                  setOriginalFormData(null);
                }
              }} 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 2, ml: 2 }}
            >
              Cancel
            </Button>
          )}
        </form>
      </Paper>

      {/* Right: Event List */}
      <Paper sx={{ flex: 1, p: 2, minHeight: 600 }}>
        <Typography variant="h4" gutterBottom>Events</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error && !events.length ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvents.map((event) => (
                    <TableRow
                      key={event.eventid}
                      onClick={() => handleEdit(event)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedEventId === event.eventid ? '#e0e0e0' : 'inherit',
                      }}
                    >
                      <TableCell>{event.eventid}</TableCell>
                      <TableCell>{event.eventname}</TableCell>
                      <TableCell>{new Date(event.eventdate).toLocaleDateString()}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(event);
                          }} 
                          color="primary"
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.eventid);
                          }} 
                          color="secondary"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                sx={{ mt: 2 }}
              >
                Previous
              </Button>
              <Typography sx={{ mt: 2 }}>Page {currentPage} of {totalPages}</Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                sx={{ mt: 2 }}
              >
                Next
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
    </div>
    </Box>
  );
};

export default EventManagement;