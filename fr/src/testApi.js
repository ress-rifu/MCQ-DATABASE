// testApi.js - Script to test API endpoints from the frontend
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from './apiConfig';

// Helper function to make authenticated API calls
const callApi = async (endpoint) => {
  try {
    // Get token directly from localStorage as a fallback mechanism
    const token = localStorage.getItem('token');
    
    // Create auth header
    let authHeader = getAuthHeader();
    
    // Log authentication details for debugging
    console.log(`Testing endpoint: ${endpoint}`);
    console.log('Token available:', !!token);
    console.log('Auth header from getAuthHeader():', authHeader);
    
    // Ensure we have Authorization in the header
    if (!authHeader.Authorization && token) {
      console.log('Using direct token from localStorage');
      authHeader = { 'Authorization': `Bearer ${token}` };
    }
    
    // Final check - if we still don't have an Authorization header, log a warning
    if (!authHeader.Authorization) {
      console.warn('⚠️ No Authorization header available for API call');
    } else {
      console.log('✅ Using Authorization header:', authHeader.Authorization.substring(0, 15) + '...');
    }
    
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: authHeader,
      withCredentials: true // Include cookies if any
    });
    
    console.log(`✅ ${endpoint} call successful:`, response.status);
    return response.data;
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    return null;
  }
};

// Test all API endpoints used in the Overview page
const testApiEndpoints = async () => {
  console.log('Testing API endpoints from frontend...');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  // Test questions stats
  console.log('\n--- Testing /api/questions/stats ---');
  const questionsStats = await callApi('/api/questions/stats');
  console.log('Questions stats:', questionsStats);
  
  // Test curriculum count
  console.log('\n--- Testing /api/curriculum/count ---');
  const curriculumCount = await callApi('/api/curriculum/count');
  console.log('Curriculum count:', curriculumCount);
  
  // Test users count
  console.log('\n--- Testing /api/users/count ---');
  const usersCount = await callApi('/api/users/count');
  console.log('Users count:', usersCount);
  
  // Test exams count
  console.log('\n--- Testing /api/exams/count ---');
  const examsCount = await callApi('/api/exams/count');
  console.log('Exams count:', examsCount);
  
  // Test courses count
  console.log('\n--- Testing /api/courses/count ---');
  const coursesCount = await callApi('/api/courses/count');
  console.log('Courses count:', coursesCount);
  
  // Test activity log
  console.log('\n--- Testing /api/activity/recent ---');
  const activityLog = await callApi('/api/activity/recent');
  console.log('Activity log:', activityLog);
  
  console.log('\nAPI endpoint testing completed');
};

// Export the test function
export default testApiEndpoints;
