const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a simple activity log table if needed (on first request)
const initializeActivityTable = async () => {
    const client = await pool.connect();
    try {
        // Check if activity_log table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename = 'activity_log'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Create the activity log table
            await client.query(`
                CREATE TABLE activity_log (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(100) NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INTEGER,
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Created activity_log table');
        }
    } catch (error) {
        console.error('Error initializing activity table:', error);
    } finally {
        client.release();
    }
};

// Initialize the table when the server starts
initializeActivityTable();

// Log an activity
router.post('/', async (req, res) => {
    try {
        const { action, entityType, entityId, details } = req.body;
        const userId = req.user.id;
        
        if (!action || !entityType) {
            return res.status(400).json({ message: 'Action and entity type are required' });
        }
        
        // Insert the activity log
        const result = await pool.query(
            `INSERT INTO activity_log 
             (user_id, action, entity_type, entity_id, details) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, action, entityType, entityId || null, details || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ message: 'Error logging activity', error: error.message });
    }
});

// Get recent activity
router.get('/recent', async (req, res) => {
    try {
        // Try to fetch from activity_log table if it exists
        try {
            const result = await pool.query(`
                SELECT 
                    a.id, 
                    a.action, 
                    a.entity_type, 
                    a.entity_id, 
                    a.details, 
                    a.created_at,
                    u.name as user_name,
                    u.email as user_email
                FROM activity_log a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
                LIMIT 10
            `);
            
            return res.json({ activities: result.rows });
        } catch (tableError) {
            console.warn('Activity table may not exist, using fallback data:', tableError.message);
            
            // Fallback: If activity_log table doesn't exist, return recent questions instead
            const recentQuestions = await pool.query(`
                SELECT 
                    q.id,
                    'question_created' as action,
                    'question' as entity_type,
                    q.id as entity_id,
                    q.created_at,
                    u.name as user_name,
                    u.email as user_email
                FROM questions q
                LEFT JOIN users u ON q.created_by = u.id
                ORDER BY q.created_at DESC
                LIMIT 10
            `);
            
            const activities = recentQuestions.rows.map(row => ({
                id: row.id,
                action: row.action,
                entity_type: row.entity_type,
                entity_id: row.entity_id,
                created_at: row.created_at,
                user: {
                    name: row.user_name || 'Unknown User',
                    email: row.user_email
                },
                details: { question_id: row.id }
            }));
            
            return res.json({ activities });
        }
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ 
            message: 'Error fetching recent activity', 
            error: error.message,
            activities: [] 
        });
    }
});

module.exports = router; 