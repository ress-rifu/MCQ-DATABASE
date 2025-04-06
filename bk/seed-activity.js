// seed-activity.js - Script to seed activity log with sample data
require('dotenv').config();
const pool = require('./db');

const seedActivityLog = async () => {
    try {
        console.log('Checking if activity_log table exists...');

        // Check if activity_log table exists
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename = 'activity_log'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('Creating activity_log table...');

            // Create the activity log table
            await pool.query(`
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
        } else {
            console.log('Activity_log table already exists');

            // Check if title and description columns exist
            const columnsResult = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'activity_log'
            `);

            const columns = columnsResult.rows.map(row => row.column_name);
            console.log('Existing columns:', columns);

            // Add title column if it doesn't exist
            if (!columns.includes('title')) {
                console.log('Adding title column to activity_log table...');
                await pool.query(`ALTER TABLE activity_log ADD COLUMN title VARCHAR(255)`);
            }

            // Add description column if it doesn't exist
            if (!columns.includes('description')) {
                console.log('Adding description column to activity_log table...');
                await pool.query(`ALTER TABLE activity_log ADD COLUMN description TEXT`);
            }
        }

        // Get a user ID to associate with activities
        const userResult = await pool.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('No users found. Creating a sample user...');

            // Create a sample user if none exists
            const newUserResult = await pool.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ('Admin User', 'admin@example.com', 'password', 'admin')
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `);

            if (newUserResult.rows.length === 0) {
                console.log('Could not create a user. Exiting.');
                return;
            }

            var userId = newUserResult.rows[0].id;
        } else {
            var userId = userResult.rows[0].id;
        }

        console.log(`Using user ID ${userId} for activities`);

        // Sample activities
        const activities = [
            {
                action: 'create_question',
                entityType: 'question',
                entityId: 1,
                title: 'Created a new question',
                description: 'Added a new math question about algebra'
            },
            {
                action: 'edit_question',
                entityType: 'question',
                entityId: 2,
                title: 'Edited question',
                description: 'Updated the options for a science question'
            },
            {
                action: 'import_questions',
                entityType: 'question_batch',
                entityId: 1,
                title: 'Imported questions',
                description: 'Imported 25 questions from Excel file'
            },
            {
                action: 'create_exam',
                entityType: 'exam',
                entityId: 1,
                title: 'Created new exam',
                description: 'Created a final exam for Class 8 Math'
            },
            {
                action: 'add_chapter',
                entityType: 'chapter',
                entityId: 3,
                title: 'Added new chapter',
                description: 'Added Chapter 5: Photosynthesis to Biology'
            }
        ];

        console.log('Adding sample activities...');

        // Insert activities
        for (const activity of activities) {
            await pool.query(`
                INSERT INTO activity_log
                (user_id, action, entity_type, entity_id, title, description)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                userId,
                activity.action,
                activity.entityType,
                activity.entityId,
                activity.title,
                activity.description
            ]);

            console.log(`Added activity: ${activity.title}`);
        }

        console.log('Successfully added sample activities to the activity log');

    } catch (error) {
        console.error('Error seeding activity log:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
};

// Run the seeding function
seedActivityLog();
