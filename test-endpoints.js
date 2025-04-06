// test-endpoints.js - Script to test API endpoints directly
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

const testEndpoints = async () => {
    try {
        console.log('Testing API endpoints...');
        
        // Test questions stats
        console.log('\n--- Testing /api/questions/stats ---');
        try {
            const questionsStatsResponse = await axios.get(`${API_BASE_URL}/api/questions/stats`);
            console.log('Questions stats:', questionsStatsResponse.data);
        } catch (error) {
            console.error('Error fetching questions stats:', error.message);
        }
        
        // Test curriculum count
        console.log('\n--- Testing /api/curriculum/count ---');
        try {
            const curriculumCountResponse = await axios.get(`${API_BASE_URL}/api/curriculum/count`);
            console.log('Curriculum count:', curriculumCountResponse.data);
        } catch (error) {
            console.error('Error fetching curriculum count:', error.message);
        }
        
        // Test users count
        console.log('\n--- Testing /api/users/count ---');
        try {
            const usersCountResponse = await axios.get(`${API_BASE_URL}/api/users/count`);
            console.log('Users count:', usersCountResponse.data);
        } catch (error) {
            console.error('Error fetching users count:', error.message);
        }
        
        // Test exams count
        console.log('\n--- Testing /api/exams/count ---');
        try {
            const examsCountResponse = await axios.get(`${API_BASE_URL}/api/exams/count`);
            console.log('Exams count:', examsCountResponse.data);
        } catch (error) {
            console.error('Error fetching exams count:', error.message);
        }
        
        // Test courses count
        console.log('\n--- Testing /api/courses/count ---');
        try {
            const coursesCountResponse = await axios.get(`${API_BASE_URL}/api/courses/count`);
            console.log('Courses count:', coursesCountResponse.data);
        } catch (error) {
            console.error('Error fetching courses count:', error.message);
        }
        
        // Test activity log
        console.log('\n--- Testing /api/activity/recent ---');
        try {
            const activityResponse = await axios.get(`${API_BASE_URL}/api/activity/recent`);
            console.log('Activity log:', activityResponse.data);
        } catch (error) {
            console.error('Error fetching activity log:', error.message);
        }
        
        console.log('\nAPI endpoint testing completed');
        
    } catch (error) {
        console.error('Error testing API endpoints:', error);
    }
};

// Run the testing function
testEndpoints();
