// API Configuration File
const API_BASE_URL = 'http://localhost:3002';
const API_URL = API_BASE_URL; // Adding API_URL as an alias for API_BASE_URL

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