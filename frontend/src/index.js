import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Get root DOM element 
const root = ReactDOM.createRoot(document.getElementById('root'));
// Render React application
root.render(
  // Development mode wrapper 
  <React.StrictMode>
    {/* Router wrapper */}
    <BrowserRouter>
      {/* Main App component */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// registers firebase messaging service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.error('❌ Service Worker registration failed:', err);
      });
  });
}
