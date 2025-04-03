import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiHome, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * Dedicated error page to display error details
 */
const ErrorPage = () => {
  const [errorDetails, setErrorDetails] = useState({
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    stack: null,
    type: 'unknown'
  });
  const [showStack, setShowStack] = useState(false);
  const navigate = useNavigate();

  // Retrieve error details from session storage
  useEffect(() => {
    try {
      const storedError = sessionStorage.getItem('errorDetails');
      if (storedError) {
        setErrorDetails(JSON.parse(storedError));
      }
    } catch (error) {
      console.error('Failed to parse stored error details:', error);
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Unknown time';
    }
  };

  // Navigate back
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="bg-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Application Error</h1>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {errorDetails.type === 'promise' 
                ? 'Unhandled Promise Rejection' 
                : errorDetails.type === 'uncaught' 
                  ? 'Uncaught Exception'
                  : 'Error'}
            </h2>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-gray-800 font-medium">
                {errorDetails.message}
              </p>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium">Time: </span>
              {formatTimestamp(errorDetails.timestamp)}
            </p>
            
            {errorDetails.stack && import.meta.env.MODE === 'development' && (
              <div className="mb-4">
                <button 
                  onClick={() => setShowStack(!showStack)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>
                    {showStack ? 'Hide' : 'Show'} Stack Trace
                  </span>
                  {showStack ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
                </button>
                
                {showStack && (
                  <div className="mt-2 p-4 bg-gray-800 text-gray-200 rounded-lg overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{errorDetails.stack}</pre>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-gray-600 text-sm mb-4">
              We apologize for the inconvenience. You can try going back to the previous page, 
              returning to the home page, or reloading the page.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
            
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FiHome className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ml-auto"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-500 max-w-md text-center">
        If this error persists, please contact your system administrator 
        with the error details shown above.
      </p>
    </div>
  );
};

export default ErrorPage; 