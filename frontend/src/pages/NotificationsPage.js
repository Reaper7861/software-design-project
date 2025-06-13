import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

const NotificationSystem = () => {

//handles the message content
  const [message, setMessage] = useState('');

  //handles the status of the message
  const [status, setStatus] = useState('');

  //used to search for volunteer name
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  
/***** HARD CODED DATA - DELETE LATER****************************/
    const volunteerList = [
    { name: 'Jordan Smith', email: 'jordan@example.com' },
    { name: 'Ava Chen', email: 'ava.chen@example.com' },
    { name: 'Liam Patel', email: 'liam.patel@example.com' },
    { name: 'Maria Gonzalez', email: 'maria.g@example.com' }
  ]; 
/*****************************************************************/
 

//handles the volunteer searchable dropdown
 const filteredVolunteers = volunteerList.filter(vol =>
    vol.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectVolunteer = (vol) => {
    setSelectedVolunteer(vol);
    setSearch(vol.name);
    setStatus('');
  };
//

  const sendNotification = () => {
     if (!selectedVolunteer) {
      setStatus('Please select a volunteer.');
      return;
    }
    if (!message.trim()) {
      setStatus('Please enter a message before sending.');
      return;
    }

    // Simulate sending notification
    console.log(`📢 Sending notification to ${selectedVolunteer.name}: "${message}"`);
    setStatus(`Notification sent to ${selectedVolunteer.name}`);
    setMessage('');
  };

  return (
<Box
      sx={{
        maxWidth: 500,
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
        Send Notification
      </Typography>

      <TextField
        label="Search Volunteer"
        fullWidth
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedVolunteer(null);
        }}
        sx={{ mb: 2 }}
      />

      {!selectedVolunteer && search && (
        <Paper sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
          <List dense>
            {filteredVolunteers.length > 0 ? (
              filteredVolunteers.map((vol, index) => (
                <React.Fragment key={index}>
                  <ListItem button onClick={() => handleSelectVolunteer(vol)}>
                    <ListItemText primary={vol.name} secondary={vol.email} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No matches found" />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {selectedVolunteer && (
        <Typography sx={{ mb: 2 }}>
          <strong>Selected:</strong> {selectedVolunteer.name} ({selectedVolunteer.email})
        </Typography>
      )}

      <TextField
        label="Message"
        multiline
        rows={4}
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" color="primary" fullWidth onClick={sendNotification}>
        Send Notification
      </Button>

      {status && (
        <Typography sx={{ mt: 2 }} color={status.includes('sent') ? 'green' : 'red'}>
          {status}
        </Typography>
      )}
    </Box>
  );
};

export default NotificationSystem;