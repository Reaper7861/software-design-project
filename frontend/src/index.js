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
