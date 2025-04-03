import React, { Component, useEffect } from 'react';
import { useNavigate, useRouteError, Link, useLocation } from 'react-router-dom';
import { useNotification } from './NotificationContext.jsx';
import { FiAlertTriangle, FiRefreshCw, FiArrowLeft, FiHome } from 'react-icons/fi';

/**
 * Error Boundary for Routes - Functional component for React Router v6 errorElement
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: notifyError } = useNotification?.() || {};

  useEffect(() => {
    // Log the error to console
    console.error('Route error caught by RouteErrorBoundary:', error);
    
    // Notify the user with a toast if notification context is available
    if (notifyError) {
      notifyError('An error occurred while rendering this page.');
    }
    
    // Store error details for debugging/reporting
    if (import.meta.env.MODE === 'development') {
      sessionStorage.setItem('routeError', JSON.stringify({
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        status: error?.status,
        path: location.pathname,
        timestamp: new Date().toISOString()
      }));
    }
  }, [error, location.pathname, notifyError]);

  // Handle different types of errors
  const errorMessage = error?.status === 404 
    ? 'Page not found'
    : error?.status === 403 
      ? 'You don\'t have permission to access this page'
      : error?.status === 401 
        ? 'Authentication required'
        : error?.message || 'Something went wrong';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-5">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {error?.status || 'Error'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage}
            </p>
            
            {/* Show stack trace in development */}
            {import.meta.env.MODE === 'development' && error?.stack && (
              <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-left">
                <p className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                  {error.stack}
                </p>
              </div>
            )}
            
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiArrowLeft className="mr-2" /> Go Back
              </button>
              
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiHome className="mr-2" /> Home
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiRefreshCw className="mr-2" /> Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Boundary Class Component for catching errors in child component tree
 */
export class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ComponentErrorBoundary:', error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Store error details for debugging/reporting
    if (import.meta.env.MODE === 'development') {
      sessionStorage.setItem('componentError', JSON.stringify({
        message: error?.message || 'Unknown error',
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Notify error reporting service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="p-6 max-w-full mx-auto bg-white rounded-xl shadow-md flex flex-col items-center my-4">
          <FiAlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-900">
            {this.props.title || 'Something went wrong'}
          </h3>
          <p className="text-gray-600 mt-2 text-center">
            {this.props.message || this.state.error?.message || 'An unexpected error occurred'}
          </p>
          
          {/* Show component stack in development */}
          {import.meta.env.MODE === 'development' && this.state.errorInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-left w-full">
              <p className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </p>
            </div>
          )}
          
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiRefreshCw className="mr-2" /> Retry
          </button>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

/**
 * Higher Order Component to wrap any component with ComponentErrorBoundary
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Error boundary options
 * @returns {React.Component} Wrapped component with error boundary
 */
export const withErrorBoundary = (Component, options = {}) => {
  const WithErrorBoundary = (props) => (
    <ComponentErrorBoundary {...options}>
      <Component {...props} />
    </ComponentErrorBoundary>
  );
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
};

export default { 
  RouteErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary
}; 