// Import required modules
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { getCorsConfig } = require('./cors-config');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Get CORS configuration from shared module
const corsConfig = getCorsConfig();

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MCQ Database API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MCQ Database API',
    version: '1.0.0',
    endpoints: [
      { path: '/', method: 'GET', description: 'API root' },
      { path: '/health', method: 'GET', description: 'Health check' },
      { path: '/api/info', method: 'GET', description: 'API information' }
    ],
    fullApiAvailable: 'Use the main backend server in the bk/ directory for full functionality'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});