import React from 'react';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { withErrorFallback } from '../components/ErrorFallback';
import { withAsyncErrorBoundary } from '../components/AsyncErrorBoundary';

/**
 * Utility to apply multiple error handling HOCs to a component in a single call
 * 
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Error handling options
 * @returns {React.Component} - Component wrapped with error handling
 */
export const withErrorHandling = (Component, options = {}) => {
  const {
    componentErrorOptions = {},
    fallbackOptions = {},
    asyncOptions = {},
    // Which HOCs to apply
    withComponent = true,
    withFallback = true, 
    withAsync = false,
  } = options;

  let WrappedComponent = Component;

  // Apply HOCs in the right order
  if (withAsync) {
    WrappedComponent = withAsyncErrorBoundary(WrappedComponent, asyncOptions);
  }
  
  if (withFallback) {
    WrappedComponent = withErrorFallback(WrappedComponent, fallbackOptions);
  }
  
  if (withComponent) {
    WrappedComponent = withErrorBoundary(WrappedComponent, componentErrorOptions);
  }

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorHandling(${displayName})`;
  
  return WrappedComponent;
};

export default withErrorHandling; 