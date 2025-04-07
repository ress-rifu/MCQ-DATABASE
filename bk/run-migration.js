// Script to apply the exam settings migration
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  const filePath = path.join(__dirname, 'migrations', 'add_exam_settings.sql');
  console.log(`Applying migration from ${filePath}...`);

  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute the migration script
      await client.query(sql);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`Migration applied successfully.`);
    } catch (err) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error(`Error applying migration:`);
      console.error(err);
      throw err;
    } finally {
      // Release client back to the pool
      client.release();
    }
  } catch (err) {
    console.error(`Error reading migration file:`);
    console.error(err);
    throw err;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
applyMigration().then(() => {
  console.log('Migration completed successfully.');
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
