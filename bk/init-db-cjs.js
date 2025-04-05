// CommonJS version
const pool = require('./db');

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check and create users table first
    console.log('Checking users table...');
    const usersTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
      );
    `);
    
    if (!usersTableExists.rows[0].exists) {
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Users table created');
      
      // Add a default admin user
      console.log('Adding default admin user...');
      await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin', 'admin@example.com', 'admin123', 'admin')
      `);
      console.log('Default admin user added');
    } else {
      console.log('Users table already exists');
    }
    
    // Check and create questions table
    console.log('Checking questions table...');
    const questionsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'questions'
      );
    `);
    
    if (!questionsTableExists.rows[0].exists) {
      console.log('Creating questions table...');
      await client.query(`
        CREATE TABLE questions (
          id SERIAL PRIMARY KEY,
          subject VARCHAR(100),
          classname VARCHAR(100),
          chapter VARCHAR(100),
          topic VARCHAR(100),
          ques TEXT NOT NULL,
          option_a TEXT,
          option_b TEXT,
          option_c TEXT,
          option_d TEXT,
          answer TEXT,
          explanation TEXT,
          hint TEXT,
          difficulty_level VARCHAR(50),
          reference TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Questions table created');
    } else {
      console.log('Questions table already exists');
    }
    
    // Check and create activity_log table
    console.log('Checking activity_log table...');
    const activityLogTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log'
      );
    `);

    if (!activityLogTableExists.rows[0].exists) {
      console.log('Creating activity_log table...');
      await client.query(`
        CREATE TABLE activity_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id INTEGER,
          details JSONB,
          title VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Activity_log table created');
      
      // Add some sample activity
      console.log('Adding sample activity...');
      await client.query(`
        INSERT INTO activity_log (user_id, action, entity_type, title, description)
        VALUES (1, 'import_questions', 'questions', 'Imported sample questions', 'Added example questions to the database')
      `);
      console.log('Sample activity added');
    } else {
      console.log('Activity_log table already exists');
      
      // Check if the activity_log table has title and description columns
      const titleColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'activity_log' 
          AND column_name = 'title'
        );
      `);
      
      if (!titleColumnExists.rows[0].exists) {
        console.log('Adding title and description columns to activity_log table...');
        try {
          await client.query(`
            ALTER TABLE activity_log 
            ADD COLUMN title VARCHAR(255),
            ADD COLUMN description TEXT
          `);
          console.log('Added title and description columns to activity_log table');
        } catch (alterError) {
          console.warn('Error adding columns to activity_log table:', alterError.message);
        }
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
  } finally {
    // Release client
    client.release();
    
    // Close pool
    try {
      await pool.end();
      console.log('Connection pool closed');
    } catch (err) {
      console.error('Error closing connection pool:', err);
    }
  }
}

// Run the initialization function
initializeDatabase(); 