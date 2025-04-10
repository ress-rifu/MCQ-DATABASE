// Test script for JWT authentication
const jwt = require('jsonwebtoken');
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Clean up JWT_SECRET by removing any newlines
const jwtSecret = (process.env.JWT_SECRET || 'default_secret').replace(/\n/g, '');
console.log('JWT_SECRET length:', jwtSecret.length);
console.log('JWT_SECRET first 5 chars:', jwtSecret.substring(0, 5));

// Generate a test token
const testToken = jwt.sign(
  { id: 1, role: 'admin' }, 
  jwtSecret, 
  { expiresIn: '1d' }
);

console.log('\nGenerated test token:', testToken);

// Verify the token
try {
  const decoded = jwt.verify(testToken, jwtSecret);
  console.log('\nToken verification successful!');
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('\nToken verification failed:', error);
}

// Create a simple test endpoint
app.use(cors());

app.get('/test-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid authorization format' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ 
      message: 'Authentication successful', 
      user: decoded,
      tokenUsed: token
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication failed', 
      error: error.message,
      tokenUsed: token
    });
  }
});

// Start the server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\nTest server running on http://localhost:${PORT}`);
  console.log(`Use this URL to test: http://localhost:${PORT}/test-auth`);
  console.log('Make sure to include the Authorization header with the token');
});
