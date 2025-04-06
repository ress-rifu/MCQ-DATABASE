// seed-data.js - Script to seed the database with sample data
require('dotenv').config();
const pool = require('./db');

const seedDatabase = async () => {
    try {
        console.log('Seeding database with sample data...');
        
        // 1. Add sample questions if none exist
        const questionsCount = await pool.query('SELECT COUNT(*) FROM questions');
        if (parseInt(questionsCount.rows[0].count) === 0) {
            console.log('Adding sample questions...');
            
            // Add 20 sample questions
            for (let i = 0; i < 20; i++) {
                const subject = ['Mathematics', 'Science', 'English', 'History'][i % 4];
                const classname = `Class ${Math.floor(i / 4) + 6}`;
                const chapter = `Chapter ${(i % 5) + 1}`;
                
                await pool.query(`
                    INSERT INTO questions (
                        subject, classname, chapter, topic, ques, 
                        option_a, option_b, option_c, option_d, answer, 
                        explanation, difficulty_level
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                    )
                `, [
                    subject,
                    classname,
                    chapter,
                    `Topic ${(i % 3) + 1}`,
                    `Sample question ${i + 1} for ${subject}?`,
                    'Option A',
                    'Option B',
                    'Option C',
                    'Option D',
                    ['a', 'b', 'c', 'd'][i % 4],
                    'This is a sample explanation',
                    ['easy', 'medium', 'hard'][i % 3]
                ]);
            }
            
            console.log('Added 20 sample questions');
        } else {
            console.log(`Questions table already has ${questionsCount.rows[0].count} records`);
        }
        
        // 2. Add sample classes, subjects, and chapters if needed
        const classesCount = await pool.query('SELECT COUNT(*) FROM classes');
        if (parseInt(classesCount.rows[0].count) === 0) {
            console.log('Adding sample classes...');
            
            // Add classes
            for (let i = 6; i <= 10; i++) {
                await pool.query(
                    'INSERT INTO classes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                    [`Class ${i}`]
                );
            }
            
            console.log('Added sample classes');
        } else {
            console.log(`Classes table already has ${classesCount.rows[0].count} records`);
        }
        
        // 3. Add sample subjects if needed
        const subjectsCount = await pool.query('SELECT COUNT(*) FROM subjects');
        if (parseInt(subjectsCount.rows[0].count) === 0) {
            console.log('Adding sample subjects...');
            
            // Get class IDs
            const classesResult = await pool.query('SELECT id FROM classes');
            const classIds = classesResult.rows.map(row => row.id);
            
            // Add subjects for each class
            for (const classId of classIds) {
                const subjects = ['Mathematics', 'Science', 'English', 'History'];
                for (const subject of subjects) {
                    await pool.query(
                        'INSERT INTO subjects (name, class_id) VALUES ($1, $2) ON CONFLICT (name, class_id) DO NOTHING',
                        [subject, classId]
                    );
                }
            }
            
            console.log('Added sample subjects');
        } else {
            console.log(`Subjects table already has ${subjectsCount.rows[0].count} records`);
        }
        
        // 4. Add sample chapters if needed
        const chaptersCount = await pool.query('SELECT COUNT(*) FROM chapters');
        if (parseInt(chaptersCount.rows[0].count) === 0) {
            console.log('Adding sample chapters...');
            
            // Get subject IDs
            const subjectsResult = await pool.query('SELECT id FROM subjects');
            const subjectIds = subjectsResult.rows.map(row => row.id);
            
            // Add chapters for each subject
            for (const subjectId of subjectIds) {
                for (let i = 1; i <= 5; i++) {
                    await pool.query(
                        'INSERT INTO chapters (name, subject_id) VALUES ($1, $2) ON CONFLICT (name, subject_id) DO NOTHING',
                        [`Chapter ${i}`, subjectId]
                    );
                }
            }
            
            console.log('Added sample chapters');
        } else {
            console.log(`Chapters table already has ${chaptersCount.rows[0].count} records`);
        }
        
        // 5. Add sample courses if needed
        try {
            const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCount.rows[0].count) === 0) {
                console.log('Adding sample courses...');
                
                // Create courses table if it doesn't exist
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS courses (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Add sample courses
                for (let i = 1; i <= 5; i++) {
                    await pool.query(
                        'INSERT INTO courses (name, description) VALUES ($1, $2)',
                        [`Course ${i}`, `Description for Course ${i}`]
                    );
                }
                
                console.log('Added sample courses');
            } else {
                console.log(`Courses table already has ${coursesCount.rows[0].count} records`);
            }
        } catch (error) {
            console.error('Error adding courses:', error.message);
        }
        
        // 6. Add sample exams if needed
        try {
            const examsCount = await pool.query('SELECT COUNT(*) FROM exams');
            if (parseInt(examsCount.rows[0].count) === 0) {
                console.log('Adding sample exams...');
                
                // Create exams table if it doesn't exist
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS exams (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        start_datetime TIMESTAMP NOT NULL,
                        end_datetime TIMESTAMP NOT NULL,
                        duration_minutes INTEGER DEFAULT 60,
                        total_marks INTEGER DEFAULT 0,
                        created_by INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Get a user ID
                const userResult = await pool.query('SELECT id FROM users LIMIT 1');
                const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
                
                // Add sample exams
                for (let i = 1; i <= 5; i++) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 7);
                    
                    await pool.query(
                        `INSERT INTO exams (
                            title, description, start_datetime, end_datetime, 
                            duration_minutes, total_marks, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            `Exam ${i}`,
                            `Description for Exam ${i}`,
                            startDate,
                            endDate,
                            60,
                            100,
                            userId
                        ]
                    );
                }
                
                console.log('Added sample exams');
            } else {
                console.log(`Exams table already has ${examsCount.rows[0].count} records`);
            }
        } catch (error) {
            console.error('Error adding exams:', error.message);
        }
        
        console.log('Database seeding completed successfully');
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
};

// Run the seeding function
seedDatabase();
