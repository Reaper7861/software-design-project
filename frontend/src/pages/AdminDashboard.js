import React from 'react';
import { Box } from '@mui/material';
import UserList from '../components/UserList';
import EventList from '../components/EventList';

const AdminDashboard = () => {
  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserList />
      <EventList />
    </Box>
  );
};

export default AdminDashboard;