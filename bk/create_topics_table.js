const pool = require('./db');

async function createTopicsTable() {
    try {
        console.log('Creating topics table...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (name, chapter_id)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('Topics table created successfully');
        
    } catch (error) {
        console.error('Error creating topics table:', error);
    } finally {
        // We don't want to end the pool here in case the script is imported in the server
        console.log('Done');
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    createTopicsTable()
        .then(() => {
            console.log('Script completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Script failed:', err);
            process.exit(1);
        });
}

module.exports = { createTopicsTable }; 