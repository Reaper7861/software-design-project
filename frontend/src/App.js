import React from 'react';
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import './App.css' // Import App.css for its appearance/styling

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
      main: '#F5F5DC',         //  beige #F5F5DC
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#B66E41',         // beige but darker #DCDCB0
    },
    
    buttonSecondary: { main: '#B66E41' }, 
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
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/events" element={<EventManagementPage />} />
          <Route path="/matching" element={<MatchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/phantompage" element={<PhantomPage />} />
        </Routes>
      </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
