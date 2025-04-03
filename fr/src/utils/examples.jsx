import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { ErrorFallback, withErrorFallback } from '../components/ErrorFallback';
import { AsyncErrorBoundary, withAsyncErrorBoundary } from '../components/AsyncErrorBoundary';
import useErrorHandling from '../hooks/useErrorHandling.jsx';
import useAxiosWithErrorHandling from '../hooks/useAxiosWithErrorHandling.jsx';
import { useNotification } from '../components/NotificationContext.jsx';
import withErrorHandling from '../common/withErrorHandling';

/**
 * Example 1: Basic Component with Error Boundary
 * 
 * This example shows how to wrap a component with an error boundary
 * to catch and handle errors during rendering.
 */
const BuggyComponent = () => {
  // This will cause an error when rendered
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error('This is a simulated error!');
  }
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Buggy Component</h3>
      <p className="mb-4">Click the button to trigger an error</p>
      <button 
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Trigger Error
      </button>
    </div>
  );
};

// Wrap with error boundary
export const ProtectedBuggyComponent = withErrorBoundary(BuggyComponent, {
  title: 'Component Error',
  message: 'An error occurred in this component'
});

/**
 * Example 2: Component with Try-Catch Error Handling
 * 
 * This example shows how to handle errors using try-catch and
 * display a fallback UI with ErrorFallback component.
 */
export const TryCatchComponent = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      // Simulate an API call that might fail
      if (Math.random() > 0.5) {
        throw new Error('Random fetch error');
      }
      
      setData({ message: 'Data fetched successfully' });
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    }
  };
  
  // Show error fallback if there's an error
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => setError(null)}
        message="Failed to fetch data"
      />
    );
  }
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Try-Catch Component</h3>
      {data ? (
        <p className="mb-4">Data: {data.message}</p>
      ) : (
        <p className="mb-4">No data yet. Click to fetch.</p>
      )}
      <button 
        onClick={fetchData}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Fetch Data
      </button>
    </div>
  );
};

/**
 * Example 3: Component with Async Error Boundary
 * 
 * This example shows how to use AsyncErrorBoundary to handle
 * errors in asynchronous operations like API calls.
 */
export const AsyncBoundaryComponent = () => {
  const fetchUserData = async () => {
    // Simulate API call with potential error
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Math.random() > 0.5) {
      throw new Error('Failed to fetch user data');
    }
    
    return { 
      name: 'John Doe',
      email: 'john@example.com' 
    };
  };
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Async Boundary Component</h3>
      <p className="mb-4">This component uses AsyncErrorBoundary</p>
      
      <AsyncErrorBoundary
        asyncFn={fetchUserData}
        loadingComponent={
          <div className="text-gray-500">Loading user data...</div>
        }
        errorFallbackProps={{
          message: "Could not load user data",
          showRefresh: true
        }}
        renderData={(userData) => (
          <div>
            <p>Name: {userData.name}</p>
            <p>Email: {userData.email}</p>
          </div>
        )}
      />
    </div>
  );
};

/**
 * Example 4: Hook-based Error Handling
 * 
 * This example demonstrates how to use the useErrorHandling hook
 * to handle errors in API calls.
 */
export const ErrorHandlingHookComponent = () => {
  const [data, setData] = useState(null);
  const { withErrorHandling, isLoading, error } = useErrorHandling();
  
  // Wrap your async function with error handling
  const fetchData = withErrorHandling(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate error
      if (Math.random() > 0.5) {
        throw new Error('Failed to fetch data');
      }
      
      const result = { message: 'Data fetched successfully' };
      setData(result);
      return result;
    },
    {
      successMessage: 'Data loaded successfully',
      errorOptions: {
        showNotification: true,
        // Don't redirect to error page for this example
        redirectTo: null
      }
    }
  );
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Error Handling Hook Component</h3>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : data ? (
        <p>{data.message}</p>
      ) : (
        <p>No data yet</p>
      )}
      
      <button
        onClick={fetchData}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500 text-white rounded mt-2"
      >
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
    </div>
  );
};

/**
 * Example 5: Axios with Error Handling
 * 
 * This example demonstrates how to use the useAxiosWithErrorHandling hook
 * for streamlined API calls with built-in error handling.
 */
export const AxiosErrorHandlingComponent = () => {
  const [data, setData] = useState(null);
  const { get, isLoading, error } = useAxiosWithErrorHandling();
  
  const fetchData = async () => {
    // For this example, we'll use a simulated endpoint that might fail
    try {
      // This would normally be a real API endpoint
      const response = await get('/api/example-data', {}, {
        successMessage: 'Data loaded successfully'
      });
      
      setData(response.data);
    } catch (err) {
      // Error is already handled by the hook
      console.log('Caught in component:', err);
    }
  };
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Axios Error Handling Component</h3>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : data ? (
        <p>{data.message}</p>
      ) : (
        <p>No data yet</p>
      )}
      
      <button
        onClick={fetchData}
        disabled={isLoading}
        className="px-4 py-2 bg-indigo-500 text-white rounded mt-2"
      >
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
    </div>
  );
};

/**
 * Example 6: Notification System
 * 
 * This example shows how to use the notification system
 * to display different types of notifications.
 */
export const NotificationComponent = () => {
  const { success, error, warning, info } = useNotification();
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Notification Component</h3>
      <p className="mb-4">Click buttons to show different notifications</p>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => success('Operation completed successfully')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Success
        </button>
        
        <button
          onClick={() => error('An error occurred')}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Error
        </button>
        
        <button
          onClick={() => warning('This action might have consequences')}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Warning
        </button>
        
        <button
          onClick={() => info('Just letting you know')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Info
        </button>
      </div>
    </div>
  );
};

/**
 * Example 7: Combined Error Handling
 * 
 * This example shows how to use the withErrorHandling HOC
 * to apply multiple layers of error handling at once.
 */
const ComplexComponent = () => {
  const [shouldError, setShouldError] = useState(false);
  
  // Component with potential error
  if (shouldError) {
    throw new Error('Simulated error in complex component');
  }
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-medium">Complex Component</h3>
      <p className="mb-4">This component uses multiple error handling layers</p>
      
      <button
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-purple-500 text-white rounded"
      >
        Trigger Error
      </button>
    </div>
  );
};

// Apply multiple error handling layers
export const FullyProtectedComponent = withErrorHandling(ComplexComponent, {
  // Use all three types of error handling
  withComponent: true,
  withFallback: true,
  withAsync: true,
  
  // Configure each layer
  componentErrorOptions: {
    title: 'Component Crashed',
    message: 'The component encountered a fatal error'
  },
  
  fallbackOptions: {
    fallbackMessage: 'Something went wrong with this component',
    showRefresh: true
  },
  
  asyncOptions: {
    asyncPropName: 'fetchData',
    errorFallbackProps: {
      message: 'Failed to load required data'
    }
  }
}); 