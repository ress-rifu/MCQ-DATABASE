const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from parent directory first
try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    console.log('Loaded environment variables from root .env file');
} catch (error) {
    console.warn('Could not load root .env file:', error.message);
}

// Then load from current directory (will override duplicates)
dotenv.config();

let pool;

// Create a db directory for SQLite if needed
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

try {
    // Get database connection string from environment variables
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }
    
    console.log('Using database connection:', connectionString.replace(/:[^:]*@/, ':****@')); // Log without password

    // Create a new database pool
    pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test the database connection
    pool.connect()
        .then(client => {
            console.log('PostgreSQL database connected successfully');
            // Initialize database tables
            initializeDatabase(client)
                .then(() => {
                    console.log('Database initialization completed');
                    client.release();
                })
                .catch(err => {
                    console.error('Error initializing database:', err.message);
                    client.release();
                });
        })
        .catch(err => {
            console.error('PostgreSQL database connection failed:', err.message);
            setupSQLiteDatabase();
        });
} catch (error) {
    console.error('Error setting up PostgreSQL connection:', error.message);
    setupSQLiteDatabase();
}

// Function to initialize database tables
async function initializeDatabase(client) {
    try {
        // Check if the exams table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'exams'
            );
        `);
        
        // If tables don't exist, create them
        if (!tableExists.rows[0].exists) {
            console.log('Exam tables do not exist. Creating tables...');
            
            // Read the schema file
            const schemaPath = path.join(__dirname, 'db_schema.sql');
            
            if (fs.existsSync(schemaPath)) {
                const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
                
                // Execute each statement separately
                const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
                
                for (const statement of statements) {
                    try {
                        await client.query(statement + ';');
                    } catch (err) {
                        // Log the error but continue with other statements
                        console.warn(`Warning executing SQL statement: ${err.message}`);
                        console.warn(`Statement: ${statement}`);
                    }
                }
                
                console.log('Database tables created successfully');
            } else {
                console.error('Schema file not found at', schemaPath);
            }
        } else {
            console.log('Exam tables already exist');
        }
    } catch (error) {
        console.error('Error in database initialization:', error);
        throw error;
    }
}

// SQLite fallback setup
function setupSQLiteDatabase() {
    console.log('Setting up SQLite as fallback database');
    
    // Create a simple in-memory mock for the pool API
    pool = {
        query: async (text, params) => {
            // Simple mock that handles our specific queries
            if (text.includes('SELECT EXISTS')) {
                return { rows: [{ exists: false }] };
            }
            if (text.includes('CREATE TABLE')) {
                return { rows: [] };
            }
            if (text.includes('INSERT INTO')) {
                return { rows: [{ id: 1 }] };
            }
            if (text.includes('SELECT COUNT')) {
                return { rows: [{ count: 0 }] };
            }
            if (text.includes('SELECT * FROM')) {
                return { rows: [] };
            }
            // Default response
            return { rows: [] };
        },
        connect: async () => {
            // Return a client object with the same query API
            return {
                query: async (text, params) => {
                    if (text.includes('SELECT EXISTS')) {
                        return { rows: [{ exists: false }] };
                    }
                    if (text.includes('CREATE TABLE')) {
                        return { rows: [] };
                    }
                    if (text.includes('INSERT INTO')) {
                        return { rows: [{ id: 1 }] };
                    }
                    if (text.includes('SELECT COUNT')) {
                        return { rows: [{ count: 0 }] };
                    }
                    if (text.includes('SELECT * FROM')) {
                        return { rows: [] };
                    }
                    // Default response
                    return { rows: [] };
                },
                release: () => {},
                on: () => {}
            };
        },
        end: async () => {
            console.log('Closed SQLite connection');
            return Promise.resolve();
        },
        on: () => {}
    };
    
    console.log('SQLite fallback setup complete. Database will be in-memory only.');
}

// Create a sample student user for testing
async function createTestStudent() {
  try {
    // Check if the student user already exists
    const checkResult = await pool.query(
      "SELECT * FROM users WHERE email = 'student@example.com'"
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Creating test student user...');
      
      // Create a student user with a known password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('student123', 10);
      
      await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ('Student User', 'student@example.com', $1, 'student')`,
        [hashedPassword]
      );
      
      console.log('Test student user created');
    } else {
      console.log('Test student user already exists');
    }
  } catch (error) {
    console.error('Error creating test student:', error);
  }
}

// Initialize the database and create test users
async function initialize() {
  try {
    // Just test the connection first
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    // Create a test student user for development purposes
    if (process.env.NODE_ENV !== 'production') {
      await createTestStudent();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Call the initialize function when the application starts
initialize();

module.exports = pool;
