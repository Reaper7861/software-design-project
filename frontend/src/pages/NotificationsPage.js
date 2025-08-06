import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Paper, List, ListItem, 
  ListItemText, Divider,  Dialog, DialogTitle, DialogContent, 
  DialogActions, Snackbar, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

///firebase stuff
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { messaging } from "../firebase";
import { onMessage } from "firebase/messaging";

// TO DO //


/// *Fix its* ///
/*
date for message received and message sent are inconsistent
 (June vs 6)
 subject line is mandatory
*/

const NotificationSystem = () => {

  //sets up the inbox feed
  const [notifications, setNotifications] = useState([]);
//handles the subject+message content
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  //handles the status of the message
  const [status, setStatus] = useState('');

  //used to search for volunteer name
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  //saves the volunteers from backend
  const [volunteerList, setVolunteerList] = useState([]);

  //for the dialog to send notif
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);

  //filters the notifs by type
  const [filterType, setFilterType] = useState('all'); // 'all' | 'sent' | 'received'

  //keeps track of the user so that we can send notifs
  const [user, setUser] = useState(null);

  ///used to display the notification banner
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', body: '' });

  const showToast = (title, body) => {
    setToastMessage({ title, body });
    setToastOpen(true);
  };




/******USER AUTHENTICATION *****/
useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
    if (user) {
      setUser(user);
    } else {
      setUser(null);
    }
  });

  return () => unsubscribeAuth();
}, []);


//** Grab the inbox of notifications here**//
useEffect(() => {
  if (!user) return;  // do nothing if no logged-in user

  const fetchNotifications = async () => {
    try {
      const idToken = await user.getIdToken();

      const res = await fetch('http://localhost:8080/api/notifications', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();



      const mappedNotifications = data.map(n => ({
        ...n,
        type: n.sender_uid === user.uid ? 'sent' : 'received',
        name: n.sender_uid === user.uid
          ? (n.receiver?.fullName || 'Recipient')
          : (n.sender?.fullName || 'Sender'),
        time: new Date(n.timestamp).toLocaleString(),
      }));

      setNotifications(mappedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  fetchNotifications();
}, [user]);


/***** NOTIFICATION USER LIST OF VOLUNTEERS+ADMINS *****/
//grabs all the users from the backend 
useEffect(() => {
  const fetchVolunteers = async () => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('http://localhost:8080/api/notifications/volunteers', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        }
      });

      if (!res.ok) throw new Error('Failed to fetch volunteers');

      const data = await res.json();
      console.log('Fetched users:', data);
      setVolunteerList(data); // backend returns array of { name, email, uid, fullName  }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    }
  };

  if (user) {
    fetchVolunteers();
  }
}, [user]);


//handles the volunteer searchable dropdown
const filteredVolunteers = volunteerList.filter(vol =>
  //filters names and emails
  (vol.email && vol.email.toLowerCase().includes(search.toLowerCase())) ||
  (vol.fullName && vol.fullName.toLowerCase().includes(search.toLowerCase()))
);
  const handleSelectVolunteer = (vol) => {
    setSelectedVolunteer(vol);
    setSearch(vol.email);
    setStatus('');
  };
//

////SET UP NOTIFICATION HERE ////

useEffect(() => {
  const unsubscribe = onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'Notification';
    const body = payload.notification?.body || '';
    showToast(title, body); // shows the toast banner !!!!!!!!!!!!!!!!!!!!!!!

    ///fix later
    const incoming = {
      type: 'received',
      name: payload.notification?.title || 'System',
      email: 'system@firebase.com',
      subject: payload.notification?.title || 'No subject',
      message: payload.notification?.body || '',
      time: new Date().toLocaleString()
    };

    setSentNotifications((prev) => [incoming, ...prev]);
  });

  return () => unsubscribe();
}, []);


///SEND NOTIFICATION HERE //

  const sendNotification = async () => {
     if (!selectedVolunteer) {
      setStatus('Please select a volunteer.');
      return;
    }

      if (!subject.trim()) {
    setStatus('Please enter a subject before sending.');
    return;
    }

    if (!message.trim()) {
      setStatus('Please enter a message before sending.');
      return;
    }
    
    try {
      const recipientUid = selectedVolunteer.uid;
      const idToken = await user.getIdToken();

      const res = await fetch('http://localhost:8080/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        toUid: recipientUid, //receiver uid
        title: subject,
        body: message,
      }),
    });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }

      setStatus(`Notification sent to ${selectedVolunteer.fullName}`);

      // Refetch notifications to update inbox
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/notifications', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        const mappedNotifications = data.map(n => ({
          ...n,
          type: n.sender_uid === user.uid ? 'sent' : 'received',
          name: n.sender_uid === user.uid ? (n.receiver_name || 'Recipient') : (n.sender_name || 'Sender'),
          time: new Date(n.timestamp).toLocaleString(),
        }));
        setNotifications(mappedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    await fetchNotifications();

    
      //clear everything after sending
      setMessage('');
      setOpen(false);
      setSearch('');
      setSelectedVolunteer(null);

    } catch (error) {
      setStatus(`Error: ${error.message}`);
  }}; 

return (
<Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'rgba(138, 154, 91, 0.3)' }}>
      {/* Left Sidebar */}
      
       <Box
        sx={{
          width: 250,
          height: '100vh',
          borderRight: '1px solid #ddd',
          bgcolor: '#f7f7f7',
          position: 'sticky',
          top: 0,
          p: 2,
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'transparent',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpen(true)}
            fullWidth
            endIcon={<SendIcon />} //the send icon at the end of txt
            sx={{ mb: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',      // bigger text
                paddingY: 1.25,           // more vertical padding
                height: 48,              // fixed height, optional
                borderRadius: 3,         // slightly more rounded corners
                lineHeight: 1.0,
            }}>
            Send
          </Button>



          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['all', 'sent', 'received'].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() => setFilterType(type)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: filterType === type ? 'bold' : 'normal',
                  borderRadius: 2,
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </Box>      
        </Paper>
      </Box>


      {/* Right: Notification Feed */}
      
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        <Paper sx={{ p: 3 }}>
          
          <Typography variant="h5" gutterBottom>
            Notification Feed
          </Typography>

          {(() => {
  const filteredList = notifications.filter(note =>
  filterType === 'all' ? true : note.type === filterType
);

  return filteredList.length === 0 ? (
    <Typography variant="body1" sx={{ mt: 2 }}>
      No notifications yet.
    </Typography>
      ) : (
        <List>
          {filteredList.map((note, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" color={note.type === 'sent' ? 'text.primary' : 'text.secondary'}>
                      {note.type === 'sent' ? `You → ${note.name}` : `${note.name} → You`} — {note.subject}
                    </Typography>
                  }
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
      );
    })()}
        </Paper>
      </Box>

      {/* Send Notification Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <TextField
            label="Search Volunteer"
            color='taupe'
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedVolunteer(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 100)}
            autoComplete="off"
            sx={{ my: 2 }}
          />
          {focused && (
            <Paper sx={{ maxHeight: 150, overflowY: 'auto', mb: 2 }}>
              <List dense>
                {filteredVolunteers.length > 0 ? (
                  filteredVolunteers.map((vol, index) => (
                    <React.Fragment key={index}>
                      <ListItem button onClick={() => handleSelectVolunteer(vol)}>
                        <ListItemText primary={vol.fullName} secondary={vol.email} />
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
              
              <strong>Selected:</strong> {selectedVolunteer.fullName} ({selectedVolunteer.email})
            </Typography>
          )}

          <TextField
            label="Subject"
            color='taupe'
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            inputProps={{ maxLength: 50 }}
            helperText={`${subject.length}/50 characters`}
            sx={{ mb: 2 }}
            />

          <TextField
            label="Message"
            color='taupe'
            multiline
            rows={4}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            inputProps={{ maxLength: 200 }}
            helperText={`${message.length}/200 characters`}
            sx={{ mb: 2 }}
          />
          {status && (
            <Typography sx={{ mb: 2 }} color={status.includes('sent') ? 'green' : 'red'}>
              {status}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button color="secondary"onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="secondary" variant="contained" onClick={sendNotification}> 
            Send
          </Button>
        </DialogActions>
      </Dialog>


      {/*for the toast notifs to show up */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={10000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToastOpen(false)} sx={{ width: '100%' }}>
          <strong>{toastMessage.title}</strong><br />
          {toastMessage.body}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSystem;