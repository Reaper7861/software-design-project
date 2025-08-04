import React, { useEffect, useState } from 'react';
import { Button, Collapse, Select, MenuItem, Typography, CircularProgress, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAuth } from "firebase/auth";
import '../css/ReportingPage.css';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [volunteersByEvent, setVolunteersByEvent] = useState({});

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

  const fetchVolunteers = async (eventId) => {
    const res = await fetch(`http://localhost:8080/api/matching/${eventId}`);

    if (!res.ok) throw new Error('Failed to fetch volunteers');

    const data = await res.json();

    console.log("Volunteers fetched: ", data);
    return data.matches || [];
  };

  const handleToggleVolunteers = async (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      if (!volunteersByEvent[eventId]) {
        const data = await fetchVolunteers(eventId);
        setVolunteersByEvent(prev => ({ ...prev, [eventId]: data }));
      }
    }
  };

  const handleStatusChange = async (eventId, uid, newStatus) => {
    await updateStatus(eventId, uid, newStatus);

    setVolunteersByEvent(prev => ({
      ...prev,
      [eventId]: prev[eventId].map(v =>
        v.uid === uid ? { ...v, participationstatus: newStatus } : v
      )
    }));
  };

  const updateStatus = async (eventId, uid, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/volunteer-history/${eventId}/${uid}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }

      console.log('Updated status');
    } catch (err) {
      console.error('Failed to update participation status:', err);
    }
  };

  

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
    {
      field: 'actions',
      headerName: 'Volunteers',
      width: 150,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => handleToggleVolunteers(params.row.id)}>
          {expandedEventId === params.row.id ? 'Hide' : 'View'}
        </Button>
      )
    }
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
     <div className="reporting-container">
      <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3 }}>
        <Typography variant="h1" className="reporting-title" sx={{ mb: 3, pb: 2 }}>
          Events
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              autoHeight
            />

            {expandedEventId && (
              <Collapse in={true}>
                <Box mt={4} p={2} sx={{ border: '1px solid #ccc', borderRadius: 2 }}>
                  <Typography variant="h6">Volunteers for Event ID: {expandedEventId}</Typography>
                  {volunteersByEvent[expandedEventId]?.length ? (
                    volunteersByEvent[expandedEventId].map((vol, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography>{vol.volunteername}</Typography>
                        <Select
                          size="small"
                          value={vol.participationstatus || 'Assigned'}
                          onChange={(e) =>
                            handleStatusChange(expandedEventId, vol.uid, e.target.value)
                          }
                        >
                          <MenuItem value="Assigned">Assigned</MenuItem>
                          <MenuItem value="Attended">Attended</MenuItem>
                          <MenuItem value="No Show">No Show</MenuItem>
                        </Select>
                      </Box>
                    ))
                  ) : (
                    <Typography>No volunteers assigned.</Typography>
                  )}
                </Box>
              </Collapse>
            )}
          </>
        )}
      </Box>
    </div>
  );
};

export default EventList;