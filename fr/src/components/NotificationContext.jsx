import React, { createContext, useState, useContext, useCallback } from 'react';

// Create notification context
const NotificationContext = createContext(null);

// Types of notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Provider component for notifications
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: NOTIFICATION_TYPES.SUCCESS,
    duration: 3000, // Default duration in ms
  });

  // Clear notification
  const clearNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // Show notification
  const notify = useCallback((message, type = NOTIFICATION_TYPES.SUCCESS, duration = 3000) => {
    // Clear any existing notification
    clearNotification();
    
    // Show the new notification
    setNotification({ 
      show: true, 
      message, 
      type, 
      duration 
    });
    
    // Set timer to clear notification
    const timer = setTimeout(clearNotification, duration);
    
    // Return function to clear notification and timer if needed
    return () => {
      clearTimeout(timer);
      clearNotification();
    };
  }, [clearNotification]);

  // Helper methods for specific notification types
  const success = useCallback((message, duration) => 
    notify(message, NOTIFICATION_TYPES.SUCCESS, duration), [notify]);
  
  const error = useCallback((message, duration) => 
    notify(message, NOTIFICATION_TYPES.ERROR, duration), [notify]);
  
  const warning = useCallback((message, duration) => 
    notify(message, NOTIFICATION_TYPES.WARNING, duration), [notify]);
  
  const info = useCallback((message, duration) => 
    notify(message, NOTIFICATION_TYPES.INFO, duration), [notify]);

  // Value provided to consumers of the context
  const value = {
    notification,
    notify,
    success,
    error,
    warning,
    info,
    clearNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Toast UI */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <div className={`px-6 py-3 rounded-md shadow-xl flex items-center ${
            notification.type === NOTIFICATION_TYPES.ERROR 
              ? 'bg-red-600 text-white' 
              : notification.type === NOTIFICATION_TYPES.WARNING
                ? 'bg-amber-500 text-white'
                : notification.type === NOTIFICATION_TYPES.INFO
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-600 text-white'
          }`}>
            <span className="mr-2">
              {notification.type === NOTIFICATION_TYPES.ERROR ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : notification.type === NOTIFICATION_TYPES.WARNING ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : notification.type === NOTIFICATION_TYPES.INFO ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default { 
  NotificationProvider,
  useNotification, 
  NOTIFICATION_TYPES
}; 