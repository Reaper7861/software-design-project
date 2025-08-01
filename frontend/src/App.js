import React from 'react';
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import './App.css' // Import App.css for its appearance/styling
import { AdminRoute } from './components/AdminRoute';
import { PrivateRoute } from './components/PrivateRoute';
import { ProfileRoute } from './components/ProfileRoute';

// Import all page components
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import EventManagementPage from './pages/EventManagementPage'
import MatchPage from './pages/MatchPage'
import NotificationsPage from './pages/NotificationsPage'
import HistoryPage from './pages/HistoryPage'
import PhantomPage from './pages/PhantomPage'
import Homepage from './pages/Homepage'

//theme for color across mui components
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // optional for consistent styling

const theme = createTheme({
  palette: {
    primary: {
      main: '#483C32',         //  taupe
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F5F5DC',         // beige #DCDCB0
    },
    taupe: {
      main: '#483C32',
      contrastText: '#fff',
    },
    beige: {
      main: '#F5F5DC'
    },
    darkbeige: {
      main: '#DCDCB0',
    },
    text: {
      primary: '#000000',         // default text
      secondary: '#483C32',       // your custom secondary text color #5c5c5c
    },
  },
  //this is to override all the button colors
 components: {
    MuiButton: {
      styleOverrides: {
        // Override styles for secondary buttons
        root: ({ ownerState, theme }) => ({
          ...(ownerState.color === 'secondary' && {
            backgroundColor: '#B66E41', // << color goes HERE
            color: '#fff',
            '&:hover': {
              backgroundColor: '#9A5933',
            },
          }),
        }),
      },
    },
  },
});


// Main app component
function App() {
  return (
    
    // Wrap app with authentication context
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
      <div>

        {/* Navigation bar displayed with all pages */}
        <Navbar />
         
        {/* Define all application routes */}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={
            <ProfileRoute>
              <ProfilePage />
            </ProfileRoute>
          } />
          <Route path="/notifications" element={
            <ProfileRoute>
              <NotificationsPage />
            </ProfileRoute>
          } />
          <Route path="/history" element={
            <ProfileRoute>
              <HistoryPage />
            </ProfileRoute>
          } />
          <Route path="/phantompage" element={<PhantomPage />} />
          <Route path="/events" element={
            <AdminRoute>
              <EventManagementPage />
            </AdminRoute>
          } />
          <Route path="/matching" element={
            <AdminRoute>
              <MatchPage />
            </AdminRoute>
            } />
        </Routes>
      </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
