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
                    title VARCHAR(255),
                    description TEXT,
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
        const { action, entityType, entityId, details, title, description } = req.body;
        const userId = req.user.id;
        
        if (!action || !entityType) {
            return res.status(400).json({ message: 'Action and entity type are required' });
        }
        
        // Insert the activity log
        const result = await pool.query(
            `INSERT INTO activity_log 
             (user_id, action, entity_type, entity_id, details, title, description) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [userId, action, entityType, entityId || null, details || null, title || null, description || null]
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
                    a.title,
                    a.description,
                    u.name as user_name,
                    u.email as user_email
                FROM activity_log a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
                LIMIT 10
            `);
            
            // Format the response
            const activities = result.rows.map(row => ({
                id: row.id,
                action: row.action,
                entity_type: row.entity_type,
                entity_id: row.entity_id,
                details: row.details,
                created_at: row.created_at,
                title: row.title || formatActivityTitle(row),
                description: row.description || '',
                activity_type: row.action, // Add activity_type to maintain compatibility with front-end
                user: {
                    name: row.user_name || 'Unknown User',
                    email: row.user_email
                }
            }));
            
            return res.json({ activities });
        } catch (tableError) {
            console.warn('Activity table may not exist, using fallback data:', tableError.message);
            
            // Check if questions table exists and return empty array if it doesn't
            try {
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
                    title: `Question #${row.id}`,
                    description: '',
                    activity_type: 'create_question',
                    user: {
                        name: row.user_name || 'Unknown User',
                        email: row.user_email
                    },
                    details: { question_id: row.id }
                }));
                
                return res.json({ activities });
            } catch (questionsTableError) {
                console.warn('Questions table might not exist:', questionsTableError.message);
                // Return empty activities if both tables don't exist
                return res.json({ activities: [] });
            }
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

// Delete imported questions by activity ID
router.delete('/:id/delete-import', async (req, res) => {
    const activityId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First, get the activity details to confirm it's an import
        const activityResult = await client.query(
            `SELECT * FROM activity_log WHERE id = $1`,
            [activityId]
        );
        
        if (activityResult.rows.length === 0) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        
        const activity = activityResult.rows[0];
        
        // Check if this is actually an import activity
        if (activity.action !== 'import_questions' && activity.entity_type !== 'questions') {
            return res.status(400).json({ message: 'This activity is not an import activity' });
        }
        
        // Get the question IDs from the activity details
        const questionIds = activity.details?.question_ids || [];
        
        if (!questionIds.length) {
            return res.status(400).json({ message: 'No question IDs found in activity details' });
        }
        
        // Delete the questions
        const deleteResult = await client.query(
            `DELETE FROM questions WHERE id = ANY($1) RETURNING id`,
            [questionIds]
        );
        
        // Log the deletion as a new activity
        await client.query(
            `INSERT INTO activity_log 
             (user_id, action, entity_type, entity_id, details) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.id, 
                'delete_import', 
                'questions', 
                null, 
                { deleted_activity_id: activityId, question_count: deleteResult.rowCount }
            ]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({ 
            message: 'Successfully deleted imported questions', 
            deleted_count: deleteResult.rowCount 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting imported questions:', error);
        res.status(500).json({ 
            message: 'Error deleting imported questions', 
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// Helper function to format activity titles
function formatActivityTitle(activity) {
    if (!activity || !activity.action) return 'Unknown Activity';
    
    switch (activity.action) {
        case 'import_questions':
            return `Imported questions batch #${activity.id || ''}`;
        case 'delete_import':
            return `Deleted questions batch`;
        case 'create_question':
            return 'Created a new question';
        case 'edit_question':
            return `Edited question #${activity.entity_id || ''}`;
        default:
            // Replace all underscores, not just the first one
            return `${activity.action.replace(/_/g, ' ')} #${activity.id || ''}`;
    }
}

module.exports = router; 