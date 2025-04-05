// API Configuration File
// Read API URL from environment variables, with fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const API_URL = API_BASE_URL; // Adding API_URL as an alias for API_BASE_URL

// Log the API URL in development mode
if (import.meta.env.DEV) {
  console.log('Using API URL:', API_BASE_URL);
}

// Helper for adding authentication headers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('Auth token available:', !!token);
  
  if (!token) {
    console.warn('No authentication token found in localStorage');
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

export { API_BASE_URL, API_URL, getAuthHeader }; 