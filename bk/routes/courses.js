// routes/courses.js
const express = require('express');
const pool = require('../db');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticate');

// Get total courses count for dashboard
router.get('/count', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM courses');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error counting courses:', err);
        res.status(500).json({ message: 'Failed to count courses' });
    }
});

// Get all courses
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM courses ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
});

// Get a specific course by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM courses WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get all course content
        const contentResult = await pool.query(
            `SELECT cc.*,
                c.name AS class_name,
                s.name AS subject_name,
                ch.name AS chapter_name
             FROM course_content cc
             LEFT JOIN classes c ON cc.class_id = c.id
             LEFT JOIN subjects s ON cc.subject_id = s.id
             LEFT JOIN chapters ch ON cc.chapter_id = ch.id
             WHERE cc.course_id = $1`,
            [id]
        );

        // Format response with course details and content
        const response = {
            ...result.rows[0],
            content: contentResult.rows
        };

        res.json(response);
    } catch (err) {
        console.error('Error fetching course:', err);
        res.status(500).json({ message: 'Failed to fetch course details' });
    }
});

// Create a new course
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Course name is required' });
        }

        const result = await pool.query(
            'INSERT INTO courses (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating course:', err);
        res.status(500).json({ message: 'Failed to create course' });
    }
});

// Update a course
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Course name is required' });
        }

        const result = await pool.query(
            `UPDATE courses
             SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [name, description || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating course:', err);
        res.status(500).json({ message: 'Failed to update course' });
    }
});

// Delete a course
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM courses WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully', deletedCourse: result.rows[0] });
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ message: 'Failed to delete course' });
    }
});

// Add content to a course
router.post('/:id/content', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { class_id, subject_id, chapter_id } = req.body;

        // Validate that at least one content type is provided
        if (!class_id && !subject_id && !chapter_id) {
            return res.status(400).json({
                message: 'At least one of class_id, subject_id, or chapter_id must be provided'
            });
        }

        // Verify the course exists
        const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Insert the content association
        const result = await pool.query(
            `INSERT INTO course_content (course_id, class_id, subject_id, chapter_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, class_id || null, subject_id || null, chapter_id || null]
        );

        // Get related content information
        let contentInfo = result.rows[0];

        if (class_id) {
            const classInfo = await pool.query('SELECT name FROM classes WHERE id = $1', [class_id]);
            if (classInfo.rows.length > 0) {
                contentInfo.class_name = classInfo.rows[0].name;
            }
        }

        if (subject_id) {
            const subjectInfo = await pool.query('SELECT name FROM subjects WHERE id = $1', [subject_id]);
            if (subjectInfo.rows.length > 0) {
                contentInfo.subject_name = subjectInfo.rows[0].name;
            }
        }

        if (chapter_id) {
            const chapterInfo = await pool.query('SELECT name FROM chapters WHERE id = $1', [chapter_id]);
            if (chapterInfo.rows.length > 0) {
                contentInfo.chapter_name = chapterInfo.rows[0].name;
            }
        }

        res.status(201).json(contentInfo);
    } catch (err) {
        console.error('Error adding course content:', err);

        // Handle unique constraint violation
        if (err.code === '23505') { // unique_violation
            return res.status(400).json({
                message: 'This content is already associated with the course'
            });
        }

        // Handle foreign key constraint violations
        if (err.code === '23503') { // foreign_key_violation
            return res.status(400).json({
                message: 'One or more referenced items (class, subject, chapter) do not exist'
            });
        }

        res.status(500).json({ message: 'Failed to add content to course' });
    }
});

// Add class and all its content to a course
router.post('/:id/class/:classId', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id, classId } = req.params;
        const { excludeSubjects = [], excludeChapters = [] } = req.body;

        await client.query('BEGIN');

        // Verify the course exists
        const courseCheck = await client.query('SELECT id FROM courses WHERE id = $1', [id]);
        if (courseCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Course not found' });
        }

        // Verify the class exists
        const classCheck = await client.query('SELECT id FROM classes WHERE id = $1', [classId]);
        if (classCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Class not found' });
        }

        // Add the class
        await client.query(
            `INSERT INTO course_content (course_id, class_id)
             VALUES ($1, $2)
             ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
            [id, classId]
        );

        // Get subjects for the class
        const subjects = await client.query(
            'SELECT id FROM subjects WHERE class_id = $1',
            [classId]
        );

        // Add subjects that aren't excluded
        for (const subject of subjects.rows) {
            if (!excludeSubjects.includes(subject.id.toString())) {
                await client.query(
                    `INSERT INTO course_content (course_id, subject_id)
                     VALUES ($1, $2)
                     ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
                    [id, subject.id]
                );

                // Get chapters for the subject
                const chapters = await client.query(
                    'SELECT id FROM chapters WHERE subject_id = $1',
                    [subject.id]
                );

                // Add chapters that aren't excluded
                for (const chapter of chapters.rows) {
                    if (!excludeChapters.includes(chapter.id.toString())) {
                        await client.query(
                            `INSERT INTO course_content (course_id, chapter_id)
                             VALUES ($1, $2)
                             ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
                            [id, chapter.id]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Class and its content added to course successfully'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding class content to course:', err);
        res.status(500).json({ message: 'Failed to add class content to course' });
    } finally {
        client.release();
    }
});

// Remove content from a course
router.delete('/:id/content/:contentId', authenticateToken, async (req, res) => {
    try {
        const { id, contentId } = req.params;

        const result = await pool.query(
            `DELETE FROM course_content
             WHERE course_id = $1 AND id = $2
             RETURNING *`,
            [id, contentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Content not found or not associated with this course'
            });
        }

        res.json({
            message: 'Content removed from course successfully',
            removedContent: result.rows[0]
        });
    } catch (err) {
        console.error('Error removing course content:', err);
        res.status(500).json({ message: 'Failed to remove content from course' });
    }
});

// Get all content for a course
router.get('/:id/content', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the course exists
        const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get all content with names
        const result = await pool.query(
            `SELECT cc.*,
                c.name AS class_name,
                s.name AS subject_name,
                ch.name AS chapter_name
             FROM course_content cc
             LEFT JOIN classes c ON cc.class_id = c.id
             LEFT JOIN subjects s ON cc.subject_id = s.id
             LEFT JOIN chapters ch ON cc.chapter_id = ch.id
             WHERE cc.course_id = $1`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching course content:', err);
        res.status(500).json({ message: 'Failed to fetch course content' });
    }
});

// Add multiple classes to a course
router.post('/:id/classes', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { classIds } = req.body;

        if (!Array.isArray(classIds) || classIds.length === 0) {
            return res.status(400).json({ message: 'classIds must be a non-empty array of class IDs' });
        }

        await client.query('BEGIN');

        // Verify the course exists
        const courseCheck = await client.query('SELECT id FROM courses WHERE id = $1', [id]);
        if (courseCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Course not found' });
        }

        // Verify all classes exist
        const classesCheck = await client.query(
            'SELECT id FROM classes WHERE id = ANY($1)',
            [classIds]
        );

        if (classesCheck.rows.length !== classIds.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'One or more classes not found' });
        }

        // Store results for response
        const addedClasses = [];

        // Process each class
        for (const classId of classIds) {
            // Add the class
            await client.query(
                `INSERT INTO course_content (course_id, class_id)
                 VALUES ($1, $2)
                 ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
                [id, classId]
            );

            // Get subjects for the class
            const subjects = await client.query(
                'SELECT id FROM subjects WHERE class_id = $1',
                [classId]
            );

            // Add all subjects for this class
            for (const subject of subjects.rows) {
                await client.query(
                    `INSERT INTO course_content (course_id, subject_id)
                     VALUES ($1, $2)
                     ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
                    [id, subject.id]
                );

                // Get chapters for the subject
                const chapters = await client.query(
                    'SELECT id FROM chapters WHERE subject_id = $1',
                    [subject.id]
                );

                // Add all chapters for this subject
                for (const chapter of chapters.rows) {
                    await client.query(
                        `INSERT INTO course_content (course_id, chapter_id)
                         VALUES ($1, $2)
                         ON CONFLICT (course_id, class_id, subject_id, chapter_id) DO NOTHING`,
                        [id, chapter.id]
                    );
                }
            }

            // Get class info for response
            const classInfo = await client.query('SELECT name FROM classes WHERE id = $1', [classId]);
            if (classInfo.rows.length > 0) {
                addedClasses.push({
                    id: classId,
                    name: classInfo.rows[0].name
                });
            }
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Classes and their content added to course successfully',
            addedClasses
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding multiple classes to course:', err);
        res.status(500).json({ message: 'Failed to add classes to course' });
    } finally {
        client.release();
    }
});

module.exports = router;