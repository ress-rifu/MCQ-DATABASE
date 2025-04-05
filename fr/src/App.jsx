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
  return (
    <NotificationProvider>
      {USE_STRICT_MODE ? (
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>
      ) : (
        <RouterProvider router={router} />
      )}
    </NotificationProvider>
  );
};

export default App;
