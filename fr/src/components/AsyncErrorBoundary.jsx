import React, { useState, useEffect, useCallback } from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * AsyncErrorBoundary - A component to handle errors in asynchronous operations
 * 
 * @param {Object} props - Component props
 * @param {Function} props.asyncFn - Async function to execute
 * @param {React.ReactNode} props.loadingComponent - Component to show while loading
 * @param {Object} props.errorFallbackProps - Props to pass to ErrorFallback
 * @param {Function} props.renderData - Function to render data once loaded
 * @param {Array} props.deps - Dependencies array for useEffect
 * @param {boolean} props.resetOnPropsChange - Whether to reset error on props change
 * @returns {React.ReactElement}
 */
export const AsyncErrorBoundary = ({
  asyncFn,
  loadingComponent = <div className="p-4 text-center text-gray-500">Loading...</div>,
  errorFallbackProps = {},
  renderData,
  deps = [],
  resetOnPropsChange = true,
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      console.error('Error in AsyncErrorBoundary:', err);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [...deps, fetchData]);

  // Reset error when specified props change
  useEffect(() => {
    if (resetOnPropsChange && error) {
      setError(null);
    }
  }, deps);

  // Handle error state
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={fetchData}
        {...errorFallbackProps}
      />
    );
  }

  // Handle loading state
  if (isLoading) {
    return loadingComponent;
  }

  // Render data
  return renderData(data);
};

/**
 * Higher Order Component version of AsyncErrorBoundary
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - Options for AsyncErrorBoundary
 * @returns {React.Component} - Wrapped component with async error handling
 */
export const withAsyncErrorBoundary = (Component, options = {}) => {
  const {
    asyncPropName = 'fetchData',
    loadingComponent,
    errorFallbackProps = {},
  } = options;

  const WithAsyncErrorBoundary = (props) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Wrap the component's async function to handle errors
    const executeAsync = useCallback(async (...args) => {
      if (!props[asyncPropName]) {
        console.error(`No async function found with name "${asyncPropName}"`);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const result = await props[asyncPropName](...args);
        setData(result);
        return result;
      } catch (err) {
        console.error('Error in withAsyncErrorBoundary:', err);
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [props, asyncPropName]);

    // If there's an error, show fallback UI
    if (error) {
      return (
        <ErrorFallback
          error={error}
          resetErrorBoundary={() => setError(null)}
          {...errorFallbackProps}
        />
      );
    }

    // Render the component with enhanced props
    return (
      <Component
        {...props}
        asyncData={data}
        isLoading={isLoading}
        asyncError={error}
        executeAsync={executeAsync}
        resetAsyncError={() => setError(null)}
      />
    );
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithAsyncErrorBoundary.displayName = `withAsyncErrorBoundary(${displayName})`;

  return WithAsyncErrorBoundary;
};

export default {
  AsyncErrorBoundary,
  withAsyncErrorBoundary
}; 