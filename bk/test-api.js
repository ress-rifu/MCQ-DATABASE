// test-api.js - Script to test API endpoints
require('dotenv').config();
const pool = require('./db');

const testApiEndpoints = async () => {
    try {
        console.log('Testing API endpoints...');
        
        // Test questions stats
        console.log('\n--- Testing /api/questions/stats ---');
        const questionsStatsQuery = `
            SELECT 
                COUNT(*) as total_questions,
                COUNT(DISTINCT subject) as total_subjects,
                COUNT(DISTINCT chapter) as total_chapters,
                COUNT(DISTINCT topic) as total_topics,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_uploads
            FROM questions
        `;
        const questionsStatsResult = await pool.query(questionsStatsQuery);
        console.log('Questions stats:', questionsStatsResult.rows[0]);
        
        // Test curriculum count
        console.log('\n--- Testing /api/curriculum/count ---');
        const [classesResult, subjectsResult, chaptersResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM classes'),
            pool.query('SELECT COUNT(*) FROM subjects'),
            pool.query('SELECT COUNT(*) FROM chapters')
        ]);
        
        const classesCount = parseInt(classesResult.rows[0].count) || 0;
        const subjectsCount = parseInt(subjectsResult.rows[0].count) || 0;
        const chaptersCount = parseInt(chaptersResult.rows[0].count) || 0;
        const totalCount = classesCount + subjectsCount + chaptersCount;
        
        console.log('Curriculum count:', {
            count: totalCount,
            classes: classesCount,
            subjects: subjectsCount,
            chapters: chaptersCount
        });
        
        // Test users count
        console.log('\n--- Testing /api/users/count ---');
        const usersCountResult = await pool.query('SELECT COUNT(*) FROM users');
        console.log('Users count:', { count: parseInt(usersCountResult.rows[0].count) || 0 });
        
        // Test exams count
        console.log('\n--- Testing /api/exams/count ---');
        try {
            const examsCountResult = await pool.query('SELECT COUNT(*) FROM exams');
            console.log('Exams count:', { count: parseInt(examsCountResult.rows[0].count) || 0 });
        } catch (error) {
            console.log('Exams table might not exist:', error.message);
            
            // Create exams table if it doesn't exist
            console.log('Creating exams table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS exams (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_datetime TIMESTAMP NOT NULL,
                    end_datetime TIMESTAMP NOT NULL,
                    negative_marking BOOLEAN DEFAULT false,
                    negative_percentage INTEGER DEFAULT 0,
                    shuffle_questions BOOLEAN DEFAULT false,
                    can_change_answer BOOLEAN DEFAULT true,
                    syllabus TEXT,
                    duration_minutes INTEGER DEFAULT 60,
                    total_marks INTEGER DEFAULT 0,
                    course_id INTEGER,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Exams table created');
            
            // Add a sample exam
            await pool.query(`
                INSERT INTO exams (
                    title, description, start_datetime, end_datetime, 
                    duration_minutes, total_marks, created_by
                ) VALUES (
                    'Sample Exam', 'This is a sample exam', 
                    NOW(), NOW() + INTERVAL '7 days', 
                    60, 100, (SELECT id FROM users LIMIT 1)
                );
            `);
            console.log('Sample exam added');
            
            // Check count again
            const examsCountResult = await pool.query('SELECT COUNT(*) FROM exams');
            console.log('Exams count after creation:', { count: parseInt(examsCountResult.rows[0].count) || 0 });
        }
        
        // Test courses count
        console.log('\n--- Testing /api/courses/count ---');
        try {
            const coursesCountResult = await pool.query('SELECT COUNT(*) FROM courses');
            console.log('Courses count:', { count: parseInt(coursesCountResult.rows[0].count) || 0 });
        } catch (error) {
            console.log('Courses table might not exist:', error.message);
            
            // Create courses table if it doesn't exist
            console.log('Creating courses table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS courses (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Courses table created');
            
            // Add a sample course
            await pool.query(`
                INSERT INTO courses (name, description)
                VALUES ('Sample Course', 'This is a sample course');
            `);
            console.log('Sample course added');
            
            // Check count again
            const coursesCountResult = await pool.query('SELECT COUNT(*) FROM courses');
            console.log('Courses count after creation:', { count: parseInt(coursesCountResult.rows[0].count) || 0 });
        }
        
        // Test activity log
        console.log('\n--- Testing /api/activity/recent ---');
        const activityResult = await pool.query(`
            SELECT a.*, u.name as user_name, u.email as user_email
            FROM activity_log a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 10
        `);
        console.log('Recent activities count:', activityResult.rows.length);
        if (activityResult.rows.length > 0) {
            console.log('First activity:', {
                id: activityResult.rows[0].id,
                action: activityResult.rows[0].action,
                title: activityResult.rows[0].title,
                created_at: activityResult.rows[0].created_at
            });
        }
        
        // Add sample questions if none exist
        console.log('\n--- Checking questions table ---');
        const questionsCountResult = await pool.query('SELECT COUNT(*) FROM questions');
        const questionsCount = parseInt(questionsCountResult.rows[0].count) || 0;
        console.log('Questions count:', questionsCount);
        
        if (questionsCount === 0) {
            console.log('Adding sample questions...');
            
            // Add sample questions
            for (let i = 0; i < 10; i++) {
                await pool.query(`
                    INSERT INTO questions (
                        subject, classname, chapter, topic, ques, 
                        option_a, option_b, option_c, option_d, answer, 
                        explanation, difficulty_level
                    ) VALUES (
                        'Mathematics', 'Class 8', 'Algebra', 'Equations', 
                        'What is the value of x in the equation 2x + 5 = 15?', 
                        '5', '10', '7.5', '5.5', 'a', 
                        'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5', 
                        'medium'
                    );
                `);
            }
            
            console.log('Added 10 sample questions');
            
            // Check count again
            const newQuestionsCountResult = await pool.query('SELECT COUNT(*) FROM questions');
            console.log('Questions count after adding samples:', parseInt(newQuestionsCountResult.rows[0].count) || 0);
        }
        
        console.log('\nAPI endpoint testing completed');
        
    } catch (error) {
        console.error('Error testing API endpoints:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
};

// Run the testing function
testApiEndpoints();
