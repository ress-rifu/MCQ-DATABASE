// Shared CORS Configuration Module
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// First try to load from parent directory
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log('Loaded CORS settings from root .env file');
} catch (error) {
  console.warn('Could not load root .env file:', error.message);
}

// Then load local .env (which will override duplicates)
dotenv.config();

// Parse CORS settings from environment variables
const getCorsConfig = () => {
  // Parse CORS origins from environment variable
  const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : [];
  const corsCredentials = process.env.CORS_CREDENTIALS === 'true';
  const corsMaxAge = parseInt(process.env.CORS_MAX_AGE || '3600', 10);
  const corsMethods = process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',').map(method => method.trim()) : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  const corsHeaders = process.env.CORS_HEADERS ? process.env.CORS_HEADERS.split(',').map(header => header.trim()) : ['Content-Type', 'Authorization'];

  // Log CORS configuration
  console.log('CORS Configuration:');
  console.log('- Origins:', corsOrigins.length > 0 ? corsOrigins : 'All origins allowed');
  console.log('- Credentials:', corsCredentials);
  console.log('- Max Age:', corsMaxAge);
  console.log('- Methods:', corsMethods);
  console.log('- Headers:', corsHeaders);

  // Return CORS configuration object
  return {
    origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all origins if none specified
    credentials: corsCredentials,
    maxAge: corsMaxAge,
    methods: corsMethods,
    allowedHeaders: corsHeaders,
    exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
  };
};

module.exports = { getCorsConfig };
