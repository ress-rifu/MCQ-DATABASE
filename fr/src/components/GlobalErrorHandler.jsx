import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext.jsx';

/**
 * GlobalErrorHandler component to catch uncaught exceptions
 * 
 * This component sets up global event listeners for uncaught errors 
 * and provides fallback UI when errors occur.
 */
const GlobalErrorHandler = ({ children }) => {
  const navigate = useNavigate();
  const { error } = useNotification?.() || {};

  useEffect(() => {
    /**
     * Handle JavaScript errors
     */
    const handleError = (event) => {
      event.preventDefault();

      // Log error details
      console.error('Uncaught global error:', {
        message: event.message || 'Unknown error',
        source: event.filename || 'Unknown source',
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Store error details for the error page
      sessionStorage.setItem('errorDetails', JSON.stringify({
        message: event.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        stack: import.meta.env.MODE === 'development' ? event.error?.stack : undefined,
        source: event.filename,
        type: 'uncaught',
      }));

      // Show notification
      if (error) {
        error('An unexpected error occurred. Redirecting to error page...');
      }

      // Navigate to error page
      navigate('/error');
    };

    /**
     * Handle unhandled Promise rejections
     */
    const handleRejection = (event) => {
      event.preventDefault();

      // Log error details
      console.error('Unhandled promise rejection:', {
        message: event.reason?.message || 'Unknown error',
        reason: event.reason,
      });

      // Store error details for the error page
      sessionStorage.setItem('errorDetails', JSON.stringify({
        message: event.reason?.message || 'Unhandled Promise rejection',
        timestamp: new Date().toISOString(),
        stack: import.meta.env.MODE === 'development' ? event.reason?.stack : undefined,
        type: 'promise',
      }));

      // Show notification
      if (error) {
        error('An unexpected error occurred. Redirecting to error page...');
      }

      // Navigate to error page
      navigate('/error');
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [navigate, error]);

  // Render children
  return children;
};

export default GlobalErrorHandler; 