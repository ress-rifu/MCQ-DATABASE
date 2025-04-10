// API Configuration File
// Read API URL from environment variables, with fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = API_BASE_URL; // Adding API_URL as an alias for API_BASE_URL

// Log the API URL in development mode
if (import.meta.env.DEV) {
  console.log('Using API URL:', API_BASE_URL);
}

// Helper for adding authentication headers
const getAuthHeader = () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Auth token available:', !!token);

    if (!token) {
      console.warn('No authentication token found in localStorage');
      return {};
    }

    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format (not a valid JWT)');
      return {};
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.warn('Token is expired, removing from localStorage');
        localStorage.removeItem('token');
        return {};
      }
    } catch (e) {
      console.error('Error parsing token payload:', e);
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error in getAuthHeader:', error);
    return {};
  }
};

export { API_BASE_URL, API_URL, getAuthHeader };