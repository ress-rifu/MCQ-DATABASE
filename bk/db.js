const { Pool } = require('pg');
require('dotenv').config();

// Validate database connection string
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set!');
    process.exit(1);
}

const isLocal = process.env.DATABASE_URL.includes('localhost');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // Add connection limits to prevent issues
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000, // Connection timeout
    connectionTimeoutMillis: 2000, // Connection timeout
});

// Add event listeners for error handling
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle database client', err);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Database connected successfully at', res.rows[0].now);
    }
});

module.exports = pool;
