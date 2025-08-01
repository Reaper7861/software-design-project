import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAuth } from "firebase/auth";

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No authenticated user found.');
          setLoading(false);
          return;
        }
        const token = await currentUser.getIdToken();
        const res = await fetch('http://localhost:8080/api/admin/events', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        console.log("Raw events:", data);
        setEvents(data.events || data);

      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  

  const columns = [
    { field: 'id', headerName: 'Event ID', width: 70 },
    { field: 'eventname', headerName: 'Event Name', flex: 1 },
    { field: 'eventdescription', headerName: 'Description', flex: 1.5 },
    { field: 'location', headerName: 'Location', flex: 1 },
    {
      field: 'requiredskills',
      headerName: 'Required Skills',
      flex: 1
    },
    { field: 'urgency', headerName: 'Urgency', width: 110 },
    {
      field: 'eventdate',
      headerName: 'Event Date',
      width: 180,
    },
  ];

  const rows = Array.isArray(events)
  ? events.map(event => ({
      id: event.eventid,
      eventname: event.eventname,
      eventdescription: event.eventdescription,
      location: event.location,
      requiredskills: Array.isArray(event.requiredskills) ? event.requiredskills : [],
      urgency: event.urgency,
      eventdate: new Date(event.eventdate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    }))
  : [];


  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>All Events</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSize={10}
        />
      )}
    </Box>
  );
};

export default EventList;