import React from 'react';
import { Box } from '@mui/material';
import UserList from '../components/UserList';
import EventList from '../components/EventList';
import ReportingPage from '../components/ReportingPage';
import '../css/ReportingPage.css';


const AdminDashboard = () => {
  return (
    <Box sx={{ 
      p: 4, 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      gap: 3 // spacing btwn components
    }}>

      {/* Reporting Section */}
      <Box >
        <ReportingPage />
      </Box>

      {/* User Management Section */}
      <Box>
        <UserList />
      </Box>

      {/* Event Management Section */}
      <Box>
        <EventList />
      </Box>
    </Box>
  );
};

export default AdminDashboard;