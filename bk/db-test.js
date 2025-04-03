const pool = require('./db');

// Simple test to check database connection
async function testDatabaseConnection() {
    console.log('Testing database connection...');
    try {
        // Test connection with a simple query
        const result = await pool.query('SELECT NOW() as time');
        console.log('Database connection successful!');
        console.log('Database time:', result.rows[0].time);
        
        // Check if questions table exists
        console.log('\nChecking questions table...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });
        
        // If we find the questions table, check its structure
        if (tablesResult.rows.some(row => row.table_name === 'questions')) {
            console.log('\nExamining questions table structure:');
            const columnsResult = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'questions'
                ORDER BY ordinal_position
            `);
            
            console.log('Columns in questions table:');
            columnsResult.rows.forEach(col => {
                console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
            });
            
            // Count records in questions table
            const countResult = await pool.query('SELECT COUNT(*) FROM questions');
            console.log(`\nTotal questions in database: ${countResult.rows[0].count}`);
        } else {
            console.error('ERROR: questions table not found in database!');
        }
        
    } catch (error) {
        console.error('Database connection error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Close the pool
        await pool.end();
        console.log('\nDatabase pool closed');
    }
}

// Run the test
testDatabaseConnection(); 