import React from 'react';
import { NotificationProvider } from './components/NotificationContext.jsx';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './App.css';

// Set to false in production to avoid double mounting in strict mode
const USE_STRICT_MODE = false;

/**
 * Main application component
 * Provides context providers for authentication and notifications
 * and renders the router with error handling capabilities
 */
const App = () => {
  const content = (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );

  // Use strict mode only in development for debugging
  return USE_STRICT_MODE ? (
    <React.StrictMode>{content}</React.StrictMode>
  ) : (
    content
  );
};

export default App;
