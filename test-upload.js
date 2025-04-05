const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:3002/api/curriculum/bulk-upload-chapters';
const EXCEL_FILE = path.join(__dirname, 'test-files', 'test-chapters.xlsx');
const TOKEN = process.env.AUTH_TOKEN || ''; // Set your auth token in environment variable or replace here

// Check if file exists
if (!fs.existsSync(EXCEL_FILE)) {
  console.error(`Error: File not found: ${EXCEL_FILE}`);
  process.exit(1);
}

// Test parameters
const classId = process.env.CLASS_ID || '1'; // Default to 1 or set in environment
const subjectId = process.env.SUBJECT_ID || '1'; // Default to 1 or set in environment
const sheetName = 'Chapters';

console.log('Test upload configuration:');
console.log('- API URL:', API_URL);
console.log('- File:', EXCEL_FILE);
console.log('- Class ID:', classId);
console.log('- Subject ID:', subjectId);
console.log('- Sheet Name:', sheetName);
console.log('- Auth Token:', TOKEN ? `${TOKEN.substring(0, 10)}...` : 'Not provided');

// Create form data
const formData = new FormData();
formData.append('file', fs.createReadStream(EXCEL_FILE));
formData.append('sheetName', sheetName);
formData.append('classId', classId);
formData.append('subjectId', subjectId);

// Display form data boundaries for debugging
console.log('\nForm data headers:');
console.log(formData.getHeaders());

// Make the API call
console.log('\nSending request...');

const headers = {
  ...formData.getHeaders()
};

// Add auth token if provided
if (TOKEN) {
  headers['Authorization'] = `Bearer ${TOKEN}`;
}

axios.post(API_URL, formData, { headers })
  .then(response => {
    console.log('\nUpload successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('\nUpload failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    }
  }); 