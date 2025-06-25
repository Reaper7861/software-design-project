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

// Main app component
function App() {
  return (

    // Wrap app with authentication context
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
