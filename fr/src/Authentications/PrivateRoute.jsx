import { Navigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { AsyncErrorBoundary } from '../components/AsyncErrorBoundary';
import { useNotification } from '../components/NotificationContext.jsx';

/**
 * PrivateRoute - A component to protect routes that require authentication
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The components to render if authenticated
 * @param {string} props.requiredRole - Optional role required to access the route
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { error } = useNotification();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const notificationSent = useRef(false);
  const redirectAttempted = useRef(false);
  const authCheckComplete = useRef(false);

  // Use effect for side effects like notifications and determining redirect
  useEffect(() => {
    // Exit if we've already attempted to redirect or if auth check is still loading
    if (redirectAttempted.current || isLoading) return;
    
    // Only proceed when auth check is complete
    if (!isLoading && !authCheckComplete.current) {
      authCheckComplete.current = true;
      
      if (!isAuthenticated) {
        if (!notificationSent.current) {
          error('You must be logged in to access this page');
          notificationSent.current = true;
        }
        setShouldRedirect(true);
        setRedirectPath('/login');
        redirectAttempted.current = true;
      } else if (requiredRole && user?.role !== requiredRole) {
        if (!notificationSent.current) {
          error('You do not have permission to access this page');
          notificationSent.current = true;
        }
        setShouldRedirect(true);
        setRedirectPath('/');
        redirectAttempted.current = true;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, error]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Handle redirects (only once)
  if (shouldRedirect) {
    redirectAttempted.current = true; // Ensure we don't try to redirect again
    return <Navigate to={redirectPath} replace state={{ from: window.location.pathname }} />;
  }

  // Only render if authenticated and has required role
  if (isAuthenticated && (!requiredRole || user?.role === requiredRole)) {
    return (
      <AsyncErrorBoundary
        asyncFn={async () => true} // Dummy function since we've already checked auth
        errorFallbackProps={{
          message: "Error loading protected content"
        }}
        renderData={() => children}
      />
    );
  }

  // Fallback while waiting for the effect to determine the redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default PrivateRoute;
