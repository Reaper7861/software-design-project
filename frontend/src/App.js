import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import './App.css' // Import App.css for its appearance/styling
import { AdminRoute } from './components/AdminRoute';
import { PrivateRoute } from './components/PrivateRoute';
import { ProfileRoute } from './components/ProfileRoute';
import { auth } from './firebase';
import { getFcmToken } from './utils/notifications';
import { onAuthStateChanged } from 'firebase/auth';

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
import Dashboard from './pages/AdminDashboard'

//import messaging stuff for the firebase service worker 
import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import { Snackbar, Alert } from "@mui/material";

//theme for color across mui components
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
      secondary: '#483C32',       //  #5c5c5c
    },
    typography: {
    fontFamily: '"Roboto Slab", serif', // Your custom font
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
  const [toast, setToast] = useState({ open: false, title: "", body: "" });

   const seenIdsRef = useRef(new Set()); //to dedupe message ids in-mem

  // Register FCM token when user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const fcmToken = await getFcmToken();
          if (fcmToken) {
            const idToken = await user.getIdToken();
            const response = await fetch('http://localhost:8080/api/notifications/save-fcm-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
              },
              body: JSON.stringify({ token: fcmToken })
            });
            if (response.ok) {
              console.log('FCM token saved successfully:', fcmToken);
            } else {
              console.error('Failed to save FCM token:', response.status, await response.text());
            }
          } else {
            console.warn('No FCM token retrieved for user:', user.uid);
          }
        } catch (error) {
          console.warn('Failed to register FCM token on app initialization:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  //for push notifications//////////////////////
   const handleIncomingPayload = (payload) => {
    // try a few places for stable id
    const id =
      (payload?.data && (payload.data.messageId || payload.data.message_id)) ||
      payload?.messageId ||
      payload?.notification?.tag ||
      // fallback: small hash from title+body+time
      `${payload?.notification?.title || ""}::${payload?.notification?.body || ""}`;

    if (id && seenIdsRef.current.has(id)) {
      console.log('Duplicate notification ignored:', id);
      return; // already shown
    }
    if (id) seenIdsRef.current.add(id);

    const title = payload?.notification?.title || payload?.data?.title || "Notification";
    const body = payload?.notification?.body || payload?.data?.body || "";

    console.log('Displaying notification:', { title, body });
    setToast({ open: true, title, body });
    // Temporary alert for debugging
    // alert(`Notification received: ${title} - ${body}`);
  };

  useEffect(() => {
    // 1) foreground FCM messages (when tab has focus)
    let unsubscribeOnMessage;
    try {
      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log("FCM foreground message received:", JSON.stringify(payload, null, 2));
        handleIncomingPayload(payload);
      });
    } catch (err) {
      console.warn("onMessage setup failed:", err);
    }

    // 2) messages posted from the service worker (background -> client)
    const swHandler = (event) => {
      const data = event?.data;
      if (!data) {
        console.warn('Received empty message from service worker');
        return;
      }
      // our SW posts { type: 'FCM_MESSAGE', payload }
      if (data.type === "FCM_MESSAGE" && data.payload) {
        console.log("Processing FCM message from service worker:", JSON.stringify(data.payload, null, 2));
        handleIncomingPayload(data.payload);
      } else {
        console.log('Unhandled service worker message:', data);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", swHandler);
    } else {
      console.warn('Service Worker not supported in this browser');
    }

    // cleanup
    return () => {
      if (typeof unsubscribeOnMessage === "function") unsubscribeOnMessage();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", swHandler);
      }
    };
  }, []);

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
            <Route path="/dashboard" element={  //admin dashboard here
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
            } />
        </Routes>

        <Snackbar
          open={toast.open}
          autoHideDuration={8000}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            severity="info"
            sx={{ width: "100%" }}
          >
            <strong>{toast.title}</strong>
            <div>{toast.body}</div>
          </Alert>
        </Snackbar>
      </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;