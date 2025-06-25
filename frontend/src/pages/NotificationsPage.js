import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Paper, List, ListItem, ListItemText, Divider,  Dialog, DialogTitle, DialogContent, DialogActions, } from '@mui/material';


// TO DO //
/* 
filter messages by receieved and sent
ability to soft-delete messages
ability to reply to messages 
notifications should be received as Assignments, Updates, or Reminders


*/ 


const NotificationSystem = () => {

//handles the subject+message content
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  //handles the status of the message
  const [status, setStatus] = useState('');

  //used to search for volunteer name
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  //for the dialog to send notif
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);

  
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

    ////the  notification content itself
    const newNotification = {
      name: selectedVolunteer.name,
      email: selectedVolunteer.email,
      subject,
      message,
      time: new Date().toLocaleString()
    };

    

    // Simulate sending notification
    ///////////////////////////////// change after implimenting backend
    console.log(`📢 Sending notification to ${selectedVolunteer.name}: "${message}"`);
    setStatus(`Notification sent to ${selectedVolunteer.name}`);
    setMessage('');
    setSentNotifications([newNotification, ...sentNotifications]);
    setOpen(false);
    setSearch('');
    setSelectedVolunteer(null);
  };



  ////////////FAKE DATA REPLACE LATER//////////////////////////////////
  useEffect(() => {
  const fakeData = [
    {
      name: 'Jordan Smith',
      email: 'jordan@example.com',
      subject: 'Urgent Reminder',
      message: 'Reminder: Please arrive 15 minutes early for the community clean-up.',
      time: 'June 10, 2025, 9:00 AM'
    },
    {
      name: 'Ava Chen',
      email: 'ava.chen@example.com',
      subject: 'Assignment',
      message: 'You’ve been assigned to the animal shelter event this Saturday.',
      time: 'June 9, 2025, 4:45 PM'
    },
    {
      name: 'Liam Patel',
      email: 'liam.patel@example.com',
      subject: 'Thank you',
      message: 'Thank you for volunteering at the food drive last week!',
      time: 'June 8, 2025, 2:20 PM'
    }
  ];

  setSentNotifications(fakeData);
}, []);

return (
<Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left Sidebar */}
      <Box sx={{ width: '250px', p: 3, borderRight: '1px solid #ddd' }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
            fullWidth
          >
            Send Notification
          </Button>
        </Paper>
      </Box>

      {/* Right: Notification Feed */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Notification Feed
          </Typography>

          {sentNotifications.length === 0 ? (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No notifications sent yet.
            </Typography>
          ) : (
            <List>
              {sentNotifications.map((note, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`${note.subject} — ${note.name} (${note.email})`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {note.message}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {note.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* Send Notification Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <TextField
            label="Search Volunteer"
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedVolunteer(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 100)}
            sx={{ my: 2 }}
          />
          {focused && (
            <Paper sx={{ maxHeight: 150, overflowY: 'auto', mb: 2 }}>
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
            label="Subject"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
            />

          <TextField
            label="Message"
            multiline
            rows={4}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          {status && (
            <Typography sx={{ mb: 2 }} color={status.includes('sent') ? 'green' : 'red'}>
              {status}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendNotification}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationSystem;