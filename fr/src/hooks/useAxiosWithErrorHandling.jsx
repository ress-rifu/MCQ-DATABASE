import { useCallback, useRef } from 'react';
import axios from 'axios';
import useErrorHandling from './useErrorHandling.jsx';
import { useAuth } from './useAuth.jsx';

// Track known 404 endpoints globally to prevent repeated requests across component remounts
// Changed to a Map to support expiration times rather than permanent blacklisting
const KNOWN_MISSING_ENDPOINTS = new Map();

// Time to keep endpoints in the blacklist (1 minute)
const ENDPOINT_BLACKLIST_TTL = 60000;

// Clear the blacklist to allow access to newly implemented endpoints
setInterval(() => {
  const now = Date.now();
  for (const [endpoint, expiryTime] of KNOWN_MISSING_ENDPOINTS.entries()) {
    if (now > expiryTime) {
      KNOWN_MISSING_ENDPOINTS.delete(endpoint);
      console.log(`Removed ${endpoint} from endpoint blacklist (expired)`);
    }
  }
}, 30000); // Check every 30 seconds

/**
 * Custom hook that provides an axios instance with built-in error handling
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.baseURL - Base URL for API requests
 * @param {boolean} options.withCredentials - Whether to include credentials
 * @returns {Object} - Enhanced axios instance and utility methods
 */
const useAxiosWithErrorHandling = (options = {}) => {
  const {
    baseURL = import.meta.env.VITE_API_BASE_URL || '',
    withCredentials = false,
  } = options;
  
  // Get auth context
  const authContext = useAuth();
  // Safely access getAuthHeader
  const getAuthHeader = authContext?.getAuthHeader || (() => ({}));
  const { withErrorHandling, isLoading, error, isEndpointLimited } = useErrorHandling();
  
  // Track pending requests to prevent duplicates
  const pendingRequestsRef = useRef({});
  
  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL,
    withCredentials,
  });
  
  // Add request interceptor to include auth token and handle duplicates
  axiosInstance.interceptors.request.use(
    (config) => {
      // Create a request identifier
      const requestId = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
      
      // Check if this exact request is already pending
      if (pendingRequestsRef.current[requestId]) {
        const timestamp = pendingRequestsRef.current[requestId];
        // Only block if the request was made very recently (within 500ms)
        if (Date.now() - timestamp < 500) {
          // Return a promise that will be canceled
          return Promise.reject({
            __CANCEL__: true,
            message: 'Duplicate request canceled'
          });
        }
      }
      
      // Mark this request as pending
      pendingRequestsRef.current[requestId] = Date.now();
      
      // Cleanup function to remove from pending when complete
      const completeRequest = () => {
        delete pendingRequestsRef.current[requestId];
      };
      
      // Add to request config so we can access it in response interceptors
      config.__completeRequest = completeRequest;
      
      // Always attempt to add auth headers
      try {
        const authHeader = getAuthHeader();
        if (authHeader && authHeader.Authorization) {
          config.headers = {
            ...config.headers,
            ...authHeader,
          };
          console.log('Added auth header to request:', config.url);
        } else {
          console.warn('No valid auth header available for request:', config.url);
          // Try to get token directly from localStorage as a fallback
          const token = localStorage.getItem('token');
          if (token) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${token}`
            };
            console.log('Added fallback auth header to request:', config.url);
          }
        }
      } catch (error) {
        console.error('Error adding auth headers:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor to cleanup pending requests
  axiosInstance.interceptors.response.use(
    (response) => {
      // Call cleanup function if it exists
      if (response.config.__completeRequest) {
        response.config.__completeRequest();
      }
      return response;
    },
    (error) => {
      // Call cleanup function even on error
      if (error.config?.__completeRequest) {
        error.config.__completeRequest();
      }
      
      // Skip internal cancellation errors
      if (error.__CANCEL__) {
        return Promise.reject(error);
      }
      
      // For certain endpoints, we want to handle 500 errors specially
      const url = error.config?.url || '';
      
      // For activity endpoint, return empty array on server error
      if (url.includes('/api/activity/recent') && error.response?.status === 500) {
        console.warn('Activity endpoint returned 500, returning empty data');
        return Promise.resolve({ data: { activities: [] } });
      }
      
      // For stats endpoints, return default values on server error
      if (url.includes('/api/questions/stats') && error.response?.status === 500) {
        console.warn('Questions stats endpoint returned 500, returning default data');
        return Promise.resolve({ data: { count: 0, userCount: 0 } });
      }
      
      if (url.includes('/api/curriculum/count') && error.response?.status === 500) {
        console.warn('Curriculum count endpoint returned 500, returning default data');
        return Promise.resolve({ data: { count: 0 } });
      }
      
      if (url.includes('/api/users/count') && error.response?.status === 500) {
        console.warn('Users count endpoint returned 500, returning default data');
        return Promise.resolve({ data: { count: 0 } });
      }
      
      return Promise.reject(error);
    }
  );
  
  // Helper methods with error handling
  
  /**
   * GET request with error handling
   */
  const get = useCallback(
    (url, config = {}, errorOptions = {}) => {
      // Check global registry for known missing endpoints
      if (KNOWN_MISSING_ENDPOINTS.has(url)) {
        const expiryTime = KNOWN_MISSING_ENDPOINTS.get(url);
        if (Date.now() < expiryTime) {
          console.info(`GET request to known missing endpoint ${url} was prevented (will retry after ${new Date(expiryTime).toLocaleTimeString()})`);
          return Promise.resolve(null);
        } else {
          // Remove expired entry
          KNOWN_MISSING_ENDPOINTS.delete(url);
        }
      }
      
      // Check if the endpoint is rate limited before making the request
      if (isEndpointLimited && isEndpointLimited(url)?.limited) {
        console.warn(`GET request to ${url} was blocked due to rate limiting`);
        // Add to global registry with expiration
        KNOWN_MISSING_ENDPOINTS.set(url, Date.now() + ENDPOINT_BLACKLIST_TTL);
        return Promise.resolve(null);
      }
      
      return withErrorHandling(
        () => axiosInstance.get(url, config),
        { 
          ...errorOptions,
          url: url,
          onError: (err) => {
            // If this is a 404, add to global registry
            if (err?.response?.status === 404) {
              KNOWN_MISSING_ENDPOINTS.set(url, Date.now() + ENDPOINT_BLACKLIST_TTL);
            }
            
            // Call original onError if provided
            if (errorOptions.onError) {
              errorOptions.onError(err);
            }
          }
        }
      )();
    },
    [axiosInstance, withErrorHandling, isEndpointLimited]
  );
  
  /**
   * POST request with error handling
   */
  const post = useCallback(
    (url, data = {}, config = {}, errorOptions = {}) => {
      return withErrorHandling(
        () => axiosInstance.post(url, data, config),
        {
          ...errorOptions,
          url: url
        }
      )();
    },
    [axiosInstance, withErrorHandling]
  );
  
  /**
   * PUT request with error handling
   */
  const put = useCallback(
    (url, data = {}, config = {}, errorOptions = {}) => {
      return withErrorHandling(
        () => axiosInstance.put(url, data, config),
        {
          ...errorOptions,
          url: url
        }
      )();
    },
    [axiosInstance, withErrorHandling]
  );
  
  /**
   * DELETE request with error handling
   */
  const del = useCallback(
    (url, config = {}, errorOptions = {}) => {
      return withErrorHandling(
        () => axiosInstance.delete(url, config),
        {
          ...errorOptions,
          url: url
        }
      )();
    },
    [axiosInstance, withErrorHandling]
  );
  
  /**
   * PATCH request with error handling
   */
  const patch = useCallback(
    (url, data = {}, config = {}, errorOptions = {}) => {
      return withErrorHandling(
        () => axiosInstance.patch(url, data, config),
        {
          ...errorOptions,
          url: url
        }
      )();
    },
    [axiosInstance, withErrorHandling]
  );
  
  return {
    axiosInstance,
    get,
    post,
    put,
    delete: del,
    patch,
    isLoading,
    error,
  };
};

export default useAxiosWithErrorHandling; 