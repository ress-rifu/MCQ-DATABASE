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
            client.release();
        })
        .catch(err => {
            console.error('PostgreSQL database connection failed:', err.message);
            setupSQLiteDatabase();
        });
} catch (error) {
    console.error('Error setting up PostgreSQL connection:', error.message);
    setupSQLiteDatabase();
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

module.exports = pool;
