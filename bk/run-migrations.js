// Script to run migrations
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcqdb'
});

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order

    console.log(`Found ${migrationFiles.length} migration files`);

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already applied migrations
    const appliedResult = await pool.query('SELECT name FROM migrations');
    const appliedMigrations = appliedResult.rows.map(row => row.name);

    console.log(`${appliedMigrations.length} migrations already applied`);

    // Run each migration that hasn't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        console.log(`Applying migration: ${file}`);

        // Read migration file
        const migrationPath = path.join(migrationsDir, file);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the entire migration file as one statement
        const statements = [migrationSql];

        console.log(`Split migration into ${statements.length} statements`);

        // Begin transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Execute each statement
          for (const statement of statements) {
            await client.query(statement);
          }

          // Record migration as applied
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );

          await client.query('COMMIT');
          console.log(`Migration ${file} applied successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error);
          throw error;
        } finally {
          client.release();
        }
      } else {
        console.log(`Migration ${file} already applied, skipping`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migrations
runMigrations();
