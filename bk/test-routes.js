const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const CSV_FILE_PATH = path.join(__dirname, '..', 'test_questions.csv');
const AUTH_TOKEN = process.env.TEST_TOKEN || ''; // Set this to a valid token

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null, headers = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Authorization': `Bearer ${AUTH_TOKEN}`
    };
    
    const finalHeaders = { ...defaultHeaders, ...headers };
    console.log(`Making ${method} request to ${url}`);
    console.log('Headers:', finalHeaders);
    
    try {
        let response;
        if (method.toLowerCase() === 'get') {
            response = await axios.get(url, { headers: finalHeaders });
        } else if (method.toLowerCase() === 'post') {
            response = await axios.post(url, data, { headers: finalHeaders });
        } else {
            throw new Error(`Unsupported method: ${method}`);
        }
        
        console.log(`Response status: ${response.status}`);
        console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Request failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
}

// Test authentication
async function testAuthentication() {
    console.log('\n=== Testing Authentication ===');
    if (!AUTH_TOKEN) {
        console.error('No auth token provided. Set the TEST_TOKEN environment variable.');
        return false;
    }
    
    try {
        // This will test if the token is valid
        await authenticatedRequest('get', '/api/questions');
        console.log('Authentication test: SUCCESS');
        return true;
    } catch (error) {
        console.error('Authentication test: FAILED');
        return false;
    }
}

// Test CSV template download
async function testCsvTemplate() {
    console.log('\n=== Testing CSV Template Download ===');
    try {
        const response = await axios.get(`${API_BASE_URL}/api/csv/template`);
        console.log(`Response status: ${response.status}`);
        console.log('Template content:', response.data);
        console.log('CSV template test: SUCCESS');
        return true;
    } catch (error) {
        console.error('CSV template test: FAILED');
        return false;
    }
}

// Test CSV upload
async function testCsvUpload() {
    console.log('\n=== Testing CSV Upload ===');
    
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`Test CSV file not found: ${CSV_FILE_PATH}`);
        return false;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_FILE_PATH));
    
    try {
        const response = await axios.post(`${API_BASE_URL}/api/csv/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        
        console.log(`Response status: ${response.status}`);
        console.log('Response data:', response.data);
        console.log('CSV upload test: SUCCESS');
        return true;
    } catch (error) {
        console.error('CSV upload test: FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received');
        } else {
            console.error('Error setting up request:', error.message);
        }
        return false;
    }
}

// Run the tests
async function runTests() {
    console.log('Starting API tests...');
    
    // Test auth first
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
        console.error('Authentication failed, skipping remaining tests');
        return;
    }
    
    // Test template download
    await testCsvTemplate();
    
    // Test CSV upload
    await testCsvUpload();
    
    console.log('\nAll tests completed.');
}

// Check for token before running
if (!AUTH_TOKEN) {
    console.error('ERROR: No authentication token provided.');
    console.log('Please set the TEST_TOKEN environment variable.');
    console.log('Example: TEST_TOKEN=your_jwt_token node test-routes.js');
} else {
    runTests().catch(error => {
        console.error('Tests failed with error:', error.message);
    });
} 