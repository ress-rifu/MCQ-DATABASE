// Simple script to add title and description columns to the activity_log table
const { Client } = require('pg');

async function addColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mcq_database',
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
      ? { rejectUnauthorized: false } 
      : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Checking if activity_log table exists...');
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log'
      );
    `);
    
    if (!tableResult.rows[0].exists) {
      console.log('Activity_log table does not exist. Please create the table first.');
      return;
    }
    
    console.log('Checking if title column exists...');
    const titleResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activity_log' 
        AND column_name = 'title'
      );
    `);
    
    if (!titleResult.rows[0].exists) {
      console.log('Adding title column...');
      await client.query(`ALTER TABLE activity_log ADD COLUMN title VARCHAR(255)`);
      console.log('Title column added successfully.');
    } else {
      console.log('Title column already exists.');
    }
    
    console.log('Checking if description column exists...');
    const descResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activity_log' 
        AND column_name = 'description'
      );
    `);
    
    if (!descResult.rows[0].exists) {
      console.log('Adding description column...');
      await client.query(`ALTER TABLE activity_log ADD COLUMN description TEXT`);
      console.log('Description column added successfully.');
    } else {
      console.log('Description column already exists.');
    }
    
    console.log('All operations completed successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the function
addColumns(); 