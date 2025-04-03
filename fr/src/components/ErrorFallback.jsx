import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

/**
 * ErrorFallback - A reusable component for displaying error messages
 * 
 * @param {Object} props
 * @param {Error} props.error - The error object
 * @param {Function} props.resetErrorBoundary - Function to reset the error state
 * @param {string} props.message - Optional custom error message
 * @param {boolean} props.showRefresh - Whether to show the refresh button
 */
export const ErrorFallback = ({ 
  error, 
  resetErrorBoundary, 
  message = "Something went wrong", 
  showRefresh = true 
}) => {
  return (
    <div className="p-4 w-full bg-white rounded-md shadow-sm border border-red-100">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-sm font-medium text-red-800">
            {message}
          </h3>
          {error && (
            <div className="mt-2 text-sm text-red-700">
              {error.message}
            </div>
          )}
          {showRefresh && resetErrorBoundary && (
            <div className="mt-4">
              <button
                type="button"
                onClick={resetErrorBoundary}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiRefreshCw className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * HOC that wraps a component to provide error handling with ErrorFallback UI
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - Options for the error handling
 * @returns {React.Component} - Wrapped component with error handling
 */
export const withErrorFallback = (Component, options = {}) => {
  const {
    fallbackMessage = "Something went wrong rendering this component",
    onError = null,
    showRefresh = true
  } = options;
  
  const WithErrorFallback = (props) => {
    const [error, setError] = React.useState(null);
    
    // Reset error state
    const resetError = () => setError(null);
    
    // Handle errors during render
    React.useEffect(() => {
      if (error && onError) {
        onError(error);
      }
    }, [error]);
    
    // If there's an error, show fallback UI
    if (error) {
      return (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetError}
          message={fallbackMessage}
          showRefresh={showRefresh}
        />
      );
    }
    
    // Otherwise, render the component
    try {
      return <Component {...props} />;
    } catch (err) {
      // Catch render errors
      console.error('Caught render error:', err);
      setError(err);
      return (
        <ErrorFallback
          error={err}
          resetErrorBoundary={resetError}
          message={fallbackMessage}
          showRefresh={showRefresh}
        />
      );
    }
  };
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorFallback.displayName = `withErrorFallback(${displayName})`;
  
  return WithErrorFallback;
};

export default {
  ErrorFallback,
  withErrorFallback
}; 