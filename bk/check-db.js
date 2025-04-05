require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const { Pool } = require('pg');

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

console.log('Checking database connection...');
console.log('DATABASE_URL:', connectionString ? 
  connectionString.replace(/:[^:]*@/, ':****@') : 'Not defined');

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

// Create a new database pool
const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the database connection
pool.connect()
  .then(client => {
    console.log('SUCCESS: PostgreSQL database connected successfully');
    
    // Execute a simple query
    return client.query('SELECT version()')
      .then(res => {
        console.log('PostgreSQL version:', res.rows[0].version);
        client.release();
        pool.end();
      })
      .catch(err => {
        client.release();
        throw err;
      });
  })
  .catch(err => {
    console.error('ERROR: PostgreSQL database connection failed:', err.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL server is running');
    console.log('2. Database exists');
    console.log('3. Username and password are correct');
    console.log('4. Database is accessible from this machine');
    pool.end();
    process.exit(1);
  }); 