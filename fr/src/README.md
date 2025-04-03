# Error Handling System

This document explains the comprehensive error handling system implemented in this application.

## Overview

The error handling system consists of several components:

1. **Error Boundaries** - Catch React component errors
2. **Global Error Handler** - Catch unhandled exceptions and rejections
3. **Route Error Elements** - Handle routing errors
4. **Error Fallbacks** - Display error messages
5. **Async Error Handling** - Handle errors in asynchronous operations
6. **Error Utilities** - Helper functions for error handling
7. **Hooks** - Custom hooks for error handling
8. **Notification System** - Display error messages to users

## How to Use

### Component Error Handling

Wrap components with error boundaries using the HOC:

```jsx
import { withErrorBoundary } from '../components/ErrorBoundary';

const MyComponent = () => {
  // Component code
};

export default withErrorBoundary(MyComponent, {
  title: 'Component Error',
  message: 'An error occurred in this component',
  onError: (error) => console.error('Custom error logging:', error)
});
```

### Route Error Handling

Route errors are handled automatically by the router configuration using the `errorElement` property.

### Try-Catch Error Handling

Use the `ErrorFallback` component to display errors in try-catch blocks:

```jsx
import { ErrorFallback } from '../components/ErrorFallback';

const MyComponent = () => {
  const [error, setError] = useState(null);
  
  const handleAction = () => {
    try {
      // Code that might throw
    } catch (err) {
      setError(err);
    }
  };
  
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => setError(null)}
        message="Failed to perform action"
      />
    );
  }
  
  return (
    // Component JSX
  );
};
```

### Async Error Handling

Wrap async operations with the `AsyncErrorBoundary` component:

```jsx
import { AsyncErrorBoundary } from '../components/AsyncErrorBoundary';

const MyDataComponent = () => {
  const fetchData = async () => {
    const response = await axios.get('/api/data');
    return response.data;
  };
  
  return (
    <AsyncErrorBoundary
      asyncFn={fetchData}
      errorFallbackProps={{
        message: "Failed to load data"
      }}
      renderData={(data) => (
        // Render data here
      )}
    />
  );
};
```

### API Error Handling

Use the `useErrorHandling` hook for API calls:

```jsx
import useErrorHandling from '../hooks/useErrorHandling';

const MyComponent = () => {
  const { withErrorHandling, error, isLoading } = useErrorHandling();
  
  const fetchData = withErrorHandling(
    async () => {
      const response = await axios.get('/api/data');
      return response.data;
    },
    {
      successMessage: 'Data loaded successfully',
      errorOptions: {
        showNotification: true,
        redirectOnAuthError: true
      }
    }
  );
  
  // Use fetchData in your component
};
```

Alternatively, use the `useAxiosWithErrorHandling` hook for a more streamlined approach:

```jsx
import useAxiosWithErrorHandling from '../hooks/useAxiosWithErrorHandling';

const MyComponent = () => {
  const { get, post, isLoading, error } = useAxiosWithErrorHandling();
  
  const fetchData = async () => {
    const response = await get('/api/data', {}, {
      successMessage: 'Data loaded successfully'
    });
    // Use response data
  };
  
  // Use fetchData in your component
};
```

### Notifications

Display notifications using the `useNotification` hook:

```jsx
import { useNotification } from '../components/NotificationContext';

const MyComponent = () => {
  const { success, error, warning, info } = useNotification();
  
  const handleAction = () => {
    try {
      // Action code
      success('Action completed successfully');
    } catch (err) {
      error('Failed to complete action');
    }
  };
  
  // Component JSX
};
```

## Architecture

### Error Flow

1. Component errors → Component Error Boundary → Error Fallback UI
2. Async errors → Async Error Boundary → Error Fallback UI
3. Route errors → Route Error Boundary → Error Page
4. Unhandled exceptions → Global Error Handler → Error Page
5. API errors → Error Utils → Notification + Error Page (if severe)

### File Structure

- `components/ErrorBoundary.jsx` - React error boundaries
- `components/GlobalErrorHandler.jsx` - Global unhandled exception handler
- `components/ErrorFallback.jsx` - Error UI components
- `components/AsyncErrorBoundary.jsx` - Async operation error handling
- `components/NotificationContext.js` - Notification system
- `hooks/useErrorHandling.js` - Error handling hook
- `hooks/useAxiosWithErrorHandling.js` - Axios with error handling
- `utils/errorUtils.js` - Error utility functions
- `Pages/ErrorPage.jsx` - Dedicated error page

## Best Practices

1. **Wrap Components** - Use error boundaries for top-level components
2. **Handle Async Errors** - Always handle errors in async operations
3. **User-Friendly Messages** - Display helpful error messages to users
4. **Log Errors** - Log errors for debugging
5. **Graceful Recovery** - Provide ways for users to recover from errors
6. **Retry Mechanism** - Implement retry mechanisms for transient errors
7. **Notifications** - Use notifications for non-fatal errors
8. **Error Page** - Redirect to the error page for fatal errors 