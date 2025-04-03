// Utility functions for error handling

/**
 * Safely execute a function and handle errors
 * @param {Function} fn - The function to execute
 * @param {Object} options - Options
 * @param {Function} options.onError - Error handler function
 * @param {*} options.fallbackValue - Value to return if error occurs
 * @returns {*} The result of the function or fallback value
 */
export const tryCatch = (fn, { onError, fallbackValue } = {}) => {
  try {
    return fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Error caught in tryCatch:', error);
    }
    return fallbackValue;
  }
};

/**
 * Execute an async function and handle errors
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Options
 * @param {Function} options.onError - Error handler function
 * @param {*} options.fallbackValue - Value to return if error occurs
 * @returns {Promise<*>} Promise resolving to the result or fallback value
 */
export const asyncTryCatch = async (asyncFn, { onError, fallbackValue } = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Error caught in asyncTryCatch:', error);
    }
    return fallbackValue;
  }
};

/**
 * Parse API error response
 * @param {Error} error - The error object
 * @returns {Object} Parsed error details
 */
export const parseApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code outside of 2xx range
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.message || error.message || 'Server error',
      type: 'response'
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      data: null,
      message: 'No response from server. Please check your connection.',
      type: 'request'
    };
  } else {
    // Something else happened in setting up the request
    return {
      status: 0,
      data: null,
      message: error.message || 'An unexpected error occurred',
      type: 'setup'
    };
  }
};

/**
 * Format user-friendly error message from API error
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error) => {
  const parsedError = parseApiError(error);
  
  // Handle specific HTTP status codes
  switch (parsedError.status) {
    case 400:
      return parsedError.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This operation could not be completed due to a conflict.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      if (parsedError.type === 'request') {
        return 'Cannot connect to the server. Please check your internet connection.';
      }
      return parsedError.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Handle API errors in a standardized way
 * @param {Error} error - The error object
 * @param {Object} options - Options
 * @param {Function} options.notify - Notification function (e.g., toast)
 * @param {Function} options.logout - Logout function for auth errors
 * @param {boolean} options.silent - Whether to suppress notifications
 * @returns {Object} Parsed error
 */
export const handleApiError = (error, { notify, logout, silent = false } = {}) => {
  const parsedError = parseApiError(error);
  
  // Log error to console
  console.error('API Error:', parsedError);
  
  // Handle authentication errors
  if (parsedError.status === 401 && logout) {
    logout();
  }
  
  // Show notification if not silent
  if (!silent && notify) {
    notify(formatErrorMessage(error), 'error');
  }
  
  return parsedError;
};

export default {
  tryCatch,
  asyncTryCatch,
  parseApiError,
  formatErrorMessage,
  handleApiError
};
