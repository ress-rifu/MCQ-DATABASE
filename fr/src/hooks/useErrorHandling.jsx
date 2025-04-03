import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatErrorMessage, handleApiError } from '../utils/errorUtils.jsx';
import { useNotification } from '../components/NotificationContext.jsx';
import { useAuth } from './useAuth.jsx';

// Rate limiting constants
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_CALLS_PER_ENDPOINT = 2; // Reduced from 3 to 2 to blacklist more quickly
const ENDPOINTS_BLACKLIST_DURATION = 60000; // Reduced to 1 minute (60000ms) to retry more frequently

/**
 * Custom hook for advanced error handling throughout the application
 */
const useErrorHandling = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate limiting state
  const endpointCallsRef = useRef({}); // Track number of calls to each endpoint
  const blacklistedEndpointsRef = useRef({}); // Track blacklisted endpoints due to repeated failures
  
  const navigate = useNavigate();
  const { error: notifyError, success, warning } = useNotification();
  const { logout } = useAuth() || {};

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if an endpoint is rate limited or blacklisted
  const isEndpointLimited = useCallback((url) => {
    const now = Date.now();
    
    // Check if endpoint is blacklisted
    if (blacklistedEndpointsRef.current[url]) {
      const blacklistExpiry = blacklistedEndpointsRef.current[url];
      if (now < blacklistExpiry) {
        return { limited: true, reason: 'blacklisted' };
      } else {
        // Remove from blacklist if expired
        delete blacklistedEndpointsRef.current[url];
      }
    }
    
    // Check rate limiting
    if (!endpointCallsRef.current[url]) {
      endpointCallsRef.current[url] = { count: 0, timestamp: now };
      return { limited: false };
    }
    
    const endpointInfo = endpointCallsRef.current[url];
    
    // Reset count if outside window
    if (now - endpointInfo.timestamp > RATE_LIMIT_WINDOW) {
      endpointCallsRef.current[url] = { count: 1, timestamp: now };
      return { limited: false };
    }
    
    // Check if rate limited
    if (endpointInfo.count >= MAX_CALLS_PER_ENDPOINT) {
      return { limited: true, reason: 'rate_limited' };
    }
    
    // Increment count
    endpointInfo.count++;
    return { limited: false };
  }, []);

  // Add endpoint to blacklist with optional permanent flag
  const blacklistEndpoint = useCallback((url, isPermanent = false) => {
    // We no longer use permanent blacklisting to allow retrying endpoints
    const expiry = Date.now() + ENDPOINTS_BLACKLIST_DURATION;
    blacklistedEndpointsRef.current[url] = expiry;
    
    // Log the blacklisting for debugging
    console.warn(`API endpoint "${url}" has been blacklisted temporarily until ${new Date(expiry).toLocaleTimeString()}`);
    
    // Show a warning notification only once
    if (warning) {
      warning(`API endpoint "${url}" is temporarily unavailable and will be retried later.`);
    }
  }, [warning]);

  // Handle different types of errors
  const handleError = useCallback(
    (err, options = {}) => {
      const {
        showNotification = true,
        redirectOnAuthError = true,
        redirectTo = null,
        logError = true,
        url = null,
      } = options;

      // Set the error in state
      setError(err);

      // Get error details
      const errorMessage = formatErrorMessage(err);
      const isAuthError = err?.response?.status === 401;
      const isServerError = err?.response?.status >= 500;
      const isNotFoundError = err?.response?.status === 404;
      const isNetworkError = err?.code === 'ERR_NETWORK';

      // Log error
      if (logError) {
        console.error('Error caught by useErrorHandling:', {
          error: err,
          message: errorMessage,
          status: err?.response?.status,
          url,
        });
      }

      // Blacklist 404 endpoints temporarily
      if (isNotFoundError && url) {
        // Use temporary blacklisting to allow for retrying later
        blacklistEndpoint(url, false);
      }

      // Show notification - less noisy for 404s
      if (showNotification && notifyError) {
        if (!isNotFoundError) {
          notifyError(errorMessage);
        }
      }

      // Handle authentication errors
      if (isAuthError && redirectOnAuthError && logout) {
        logout();
        return;
      }

      // Redirect for severe errors
      if (redirectTo) {
        navigate(redirectTo);
      } else if (isServerError || isNetworkError) {
        // Store error for error page
        sessionStorage.setItem(
          'errorDetails',
          JSON.stringify({
            message: errorMessage,
            timestamp: new Date().toISOString(),
            stack: import.meta.env.MODE === 'development' ? err.stack : undefined,
            type: isNetworkError ? 'network' : 'server',
          })
        );
        navigate('/error');
      }

      return {
        message: errorMessage,
        isAuthError,
        isServerError,
        isNetworkError,
        isNotFoundError,
      };
    },
    [navigate, notifyError, logout, blacklistEndpoint]
  );

  // Wrap async function with error handling and loading state
  const withErrorHandling = useCallback(
    (asyncFn, options = {}) => {
      const {
        errorOptions = {},
        onSuccess = null,
        onError = null,
        successMessage = null,
        resetErrorOnStart = true,
        skipRateLimiting = false,
        url = null,
      } = options;

      return async (...args) => {
        const endpointUrl = url || 
          (typeof args[0] === 'string' ? args[0] : null);
        
        // Check rate limiting if we have a URL and rate limiting is not skipped
        if (endpointUrl && !skipRateLimiting) {
          const limitCheck = isEndpointLimited(endpointUrl);
          if (limitCheck.limited) {
            console.warn(`Request to ${endpointUrl} ${limitCheck.reason === 'blacklisted' ? 'blacklisted' : 'rate limited'}`);
            return Promise.resolve(null);
          }
        }
        
        try {
          setIsLoading(true);
          if (resetErrorOnStart) {
            clearError();
          }

          const result = await asyncFn(...args);

          // Handle success
          if (onSuccess) {
            onSuccess(result);
          }
          
          if (successMessage && success) {
            success(successMessage);
          }

          return result;
        } catch (err) {
          // Call the onError callback if provided
          if (onError) {
            onError(err);
          }
          
          handleError(err, { ...errorOptions, url: endpointUrl });
          return null;
        } finally {
          setIsLoading(false);
        }
      };
    },
    [clearError, handleError, isEndpointLimited, success]
  );

  return {
    error,
    isLoading,
    setError,
    clearError,
    handleError,
    withErrorHandling,
    isEndpointLimited,
  };
};

export default useErrorHandling;
