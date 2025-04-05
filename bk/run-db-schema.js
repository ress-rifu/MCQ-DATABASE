const fs = require('fs');
const path = require('path');
const pool = require('./db');

// Read the SQL file
const schemaFilePath = path.join(__dirname, 'db_schema.sql');
const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');

async function runSchema() {
  try {
    console.log('Connecting to database...');
    console.log('Executing db_schema.sql...');
    
    // Execute the SQL
    await pool.query(schemaSql);
    
    console.log('Schema updates completed successfully!');
    console.log('Tables for courses and related functionality have been created.');
  } catch (error) {
    console.error('Error executing schema updates:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
runSchema(); 