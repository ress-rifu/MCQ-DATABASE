// routes/curriculum.js
const express = require('express');
const pool = require('../db');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticate');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Set up multer storage for Excel files
const excelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../uploads/curriculum');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chapters-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const excelUpload = multer({ 
    storage: excelStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all classes
router.get('/classes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM classes ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

// Add a new class
router.post('/classes', authenticateToken, async (req, res) => {
    try {
        console.log('POST /classes request received with user:', req.user);
        console.log('Request body:', req.body);
        
        const { name } = req.body;
        if (!name) {
            console.log('POST /classes failed: Class name is required');
            return res.status(400).json({ message: 'Class name is required' });
        }

        console.log('Inserting class with name:', name);
        const result = await pool.query(
            'INSERT INTO classes (name) VALUES ($1) RETURNING *',
            [name]
        );
        console.log('Class inserted successfully, returning:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            console.error('POST /classes failed with unique violation:', err);
            return res.status(400).json({ message: 'Class already exists' });
        }
        console.error('Error adding class:', err);
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        res.status(500).json({ message: 'Failed to add class', error: err.message });
    }
});

// Update a class
router.put('/classes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: 'Class name is required' });
        }

        const result = await pool.query(
            'UPDATE classes SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Class name already exists' });
        }
        console.error('Error updating class:', err);
        res.status(500).json({ message: 'Failed to update class' });
    }
});

// Delete a class
router.delete('/classes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json({ message: 'Class deleted successfully' });
    } catch (err) {
        console.error('Error deleting class:', err);
        res.status(500).json({ message: 'Failed to delete class' });
    }
});

// Get all subjects for a class
router.get('/classes/:classId/subjects', async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await pool.query(
            'SELECT s.*, c.name as class_name FROM subjects s JOIN classes c ON s.class_id = c.id WHERE s.class_id = $1 ORDER BY s.name',
            [classId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

// Get all subjects across all classes
router.get('/subjects', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT s.*, c.name as class_name FROM subjects s JOIN classes c ON s.class_id = c.id ORDER BY c.name, s.name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all subjects:', err);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

// Add a new subject
router.post('/subjects', authenticateToken, async (req, res) => {
    try {
        const { name, class_id } = req.body;
        
        if (!name || !class_id) {
            return res.status(400).json({ message: 'Subject name and class ID are required' });
        }

        // Check if class exists
        const classCheck = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
        if (classCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const result = await pool.query(
            'INSERT INTO subjects (name, class_id) VALUES ($1, $2) RETURNING *',
            [name, class_id]
        );
        
        // Get class name for response
        const className = classCheck.rows[0].name;
        const subject = result.rows[0];
        subject.class_name = className;

        res.status(201).json(subject);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Subject already exists for this class' });
        }
        console.error('Error adding subject:', err);
        res.status(500).json({ message: 'Failed to add subject' });
    }
});

// Update a subject
router.put('/subjects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, class_id } = req.body;
        
        if (!name || !class_id) {
            return res.status(400).json({ message: 'Subject name and class ID are required' });
        }

        // Check if class exists
        const classCheck = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
        if (classCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const result = await pool.query(
            'UPDATE subjects SET name = $1, class_id = $2 WHERE id = $3 RETURNING *',
            [name, class_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get class name for response
        const subject = result.rows[0];
        subject.class_name = classCheck.rows[0].name;

        res.json(subject);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Subject name already exists for this class' });
        }
        console.error('Error updating subject:', err);
        res.status(500).json({ message: 'Failed to update subject' });
    }
});

// Delete a subject
router.delete('/subjects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM subjects WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ message: 'Subject deleted successfully' });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ message: 'Failed to delete subject' });
    }
});

// Get all chapters for a subject
router.get('/subjects/:subjectId/chapters', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const result = await pool.query(
            `SELECT ch.*, s.name as subject_name, c.name as class_name 
             FROM chapters ch 
             JOIN subjects s ON ch.subject_id = s.id 
             JOIN classes c ON s.class_id = c.id 
             WHERE ch.subject_id = $1 ORDER BY ch.name`,
            [subjectId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching chapters:', err);
        res.status(500).json({ message: 'Failed to fetch chapters' });
    }
});

// Get all chapters across all subjects and classes
router.get('/chapters', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ch.*, s.name as subject_name, c.name as class_name 
             FROM chapters ch 
             JOIN subjects s ON ch.subject_id = s.id 
             JOIN classes c ON s.class_id = c.id 
             ORDER BY c.name, s.name, ch.name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all chapters:', err);
        res.status(500).json({ message: 'Failed to fetch chapters' });
    }
});

// Add a new chapter
router.post('/chapters', authenticateToken, async (req, res) => {
    try {
        const { name, subject_id } = req.body;
        
        if (!name || !subject_id) {
            return res.status(400).json({ message: 'Chapter name and subject ID are required' });
        }

        // Check if subject exists and get related class
        const subjectCheck = await pool.query(
            `SELECT s.*, c.name as class_name 
             FROM subjects s 
             JOIN classes c ON s.class_id = c.id 
             WHERE s.id = $1`, 
            [subject_id]
        );
        
        if (subjectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const result = await pool.query(
            'INSERT INTO chapters (name, subject_id) VALUES ($1, $2) RETURNING *',
            [name, subject_id]
        );
        
        // Prepare response with related info
        const chapter = result.rows[0];
        chapter.subject_name = subjectCheck.rows[0].name;
        chapter.class_name = subjectCheck.rows[0].class_name;

        res.status(201).json(chapter);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Chapter already exists for this subject' });
        }
        console.error('Error adding chapter:', err);
        res.status(500).json({ message: 'Failed to add chapter' });
    }
});

// Update a chapter
router.put('/chapters/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject_id } = req.body;
        
        if (!name || !subject_id) {
            return res.status(400).json({ message: 'Chapter name and subject ID are required' });
        }

        // Check if subject exists and get related class
        const subjectCheck = await pool.query(
            `SELECT s.*, c.name as class_name 
             FROM subjects s 
             JOIN classes c ON s.class_id = c.id 
             WHERE s.id = $1`, 
            [subject_id]
        );
        
        if (subjectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const result = await pool.query(
            'UPDATE chapters SET name = $1, subject_id = $2 WHERE id = $3 RETURNING *',
            [name, subject_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Prepare response with related info
        const chapter = result.rows[0];
        chapter.subject_name = subjectCheck.rows[0].name;
        chapter.class_name = subjectCheck.rows[0].class_name;

        res.json(chapter);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Chapter name already exists for this subject' });
        }
        console.error('Error updating chapter:', err);
        res.status(500).json({ message: 'Failed to update chapter' });
    }
});

// Delete a chapter
router.delete('/chapters/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM chapters WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.json({ message: 'Chapter deleted successfully' });
    } catch (err) {
        console.error('Error deleting chapter:', err);
        res.status(500).json({ message: 'Failed to delete chapter' });
    }
});

// Get all topics for a chapter
router.get('/chapters/:chapterId/topics', async (req, res) => {
    try {
        const { chapterId } = req.params;
        
        // Check if chapter exists
        const chapterCheck = await pool.query('SELECT * FROM chapters WHERE id = $1', [chapterId]);
        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        
        const result = await pool.query(
            `SELECT t.*, ch.name as chapter_name, s.name as subject_name, c.name as class_name 
             FROM topics t
             JOIN chapters ch ON t.chapter_id = ch.id
             JOIN subjects s ON ch.subject_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE t.chapter_id = $1
             ORDER BY t.name`,
            [chapterId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching topics:', err);
        res.status(500).json({ message: 'Failed to fetch topics' });
    }
});

// Get all topics across all chapters
router.get('/topics', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, ch.name as chapter_name, s.name as subject_name, c.name as class_name 
             FROM topics t
             JOIN chapters ch ON t.chapter_id = ch.id
             JOIN subjects s ON ch.subject_id = s.id
             JOIN classes c ON s.class_id = c.id
             ORDER BY c.name, s.name, ch.name, t.name`
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all topics:', err);
        res.status(500).json({ message: 'Failed to fetch topics' });
    }
});

// Add a new topic
router.post('/topics', authenticateToken, async (req, res) => {
    try {
        const { name, chapter_id, description } = req.body;
        
        if (!name || !chapter_id) {
            return res.status(400).json({ message: 'Topic name and chapter ID are required' });
        }

        // Check if chapter exists and get related info
        const chapterCheck = await pool.query(
            `SELECT ch.*, s.name as subject_name, c.name as class_name 
             FROM chapters ch 
             JOIN subjects s ON ch.subject_id = s.id 
             JOIN classes c ON s.class_id = c.id 
             WHERE ch.id = $1`, 
            [chapter_id]
        );
        
        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        const result = await pool.query(
            'INSERT INTO topics (name, chapter_id, description) VALUES ($1, $2, $3) RETURNING *',
            [name, chapter_id, description || null]
        );
        
        // Prepare response with related info
        const topic = result.rows[0];
        topic.chapter_name = chapterCheck.rows[0].name;
        topic.subject_name = chapterCheck.rows[0].subject_name;
        topic.class_name = chapterCheck.rows[0].class_name;

        res.status(201).json(topic);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Topic already exists for this chapter' });
        }
        console.error('Error adding topic:', err);
        res.status(500).json({ message: 'Failed to add topic' });
    }
});

// Update a topic
router.put('/topics/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, chapter_id, description } = req.body;
        
        if (!name || !chapter_id) {
            return res.status(400).json({ message: 'Topic name and chapter ID are required' });
        }

        // Check if chapter exists and get related info
        const chapterCheck = await pool.query(
            `SELECT ch.*, s.name as subject_name, c.name as class_name 
             FROM chapters ch 
             JOIN subjects s ON ch.subject_id = s.id 
             JOIN classes c ON s.class_id = c.id 
             WHERE ch.id = $1`, 
            [chapter_id]
        );
        
        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        const result = await pool.query(
            'UPDATE topics SET name = $1, chapter_id = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [name, chapter_id, description || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        // Prepare response with related info
        const topic = result.rows[0];
        topic.chapter_name = chapterCheck.rows[0].name;
        topic.subject_name = chapterCheck.rows[0].subject_name;
        topic.class_name = chapterCheck.rows[0].class_name;

        res.json(topic);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Topic name already exists for this chapter' });
        }
        console.error('Error updating topic:', err);
        res.status(500).json({ message: 'Failed to update topic' });
    }
});

// Delete a topic
router.delete('/topics/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        res.json({ message: 'Topic deleted successfully' });
    } catch (err) {
        console.error('Error deleting topic:', err);
        res.status(500).json({ message: 'Failed to delete topic' });
    }
});

// Bulk upload chapters from Excel file
router.post('/bulk-upload-chapters', authenticateToken, excelUpload.single('file'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('Bulk upload request received:');
        console.log('- Body:', req.body);
        console.log('- File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
        console.log('- User:', req.user);
        
        if (!req.file) {
            console.log('Error: No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        if (!req.body.sheetName) {
            console.log('Error: No sheet name provided');
            return res.status(400).json({ message: 'Sheet name is required' });
        }

        if (!req.body.classId || !req.body.subjectId) {
            console.log('Error: Missing classId or subjectId', { classId: req.body.classId, subjectId: req.body.subjectId });
            return res.status(400).json({ message: 'Class ID and Subject ID are required' });
        }
        
        const classId = req.body.classId;
        const subjectId = req.body.subjectId;
        console.log(`Processing upload for Class ID: ${classId}, Subject ID: ${subjectId}`);
        
        // Verify class and subject exist and match
        console.log('Verifying class and subject relationship...');
        const subjectCheck = await client.query(
            'SELECT s.*, c.name as class_name FROM subjects s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.id = $2',
            [subjectId, classId]
        );
        
        if (subjectCheck.rows.length === 0) {
            console.log('Error: Subject not found or does not belong to class', { subjectId, classId });
            return res.status(404).json({ message: 'Subject not found or does not belong to the specified class' });
        }
        
        console.log('Subject verification successful:', subjectCheck.rows[0]);
        
        // Read the Excel file
        console.log(`Reading Excel file from path: ${req.file.path}`);
        const workbook = xlsx.readFile(req.file.path);
        console.log(`Excel file read successfully. Available sheets: ${workbook.SheetNames.join(', ')}`);
        
        const sheetName = req.body.sheetName;
        
        if (!workbook.SheetNames.includes(sheetName)) {
            console.log(`Error: Sheet "${sheetName}" not found in workbook`);
            return res.status(400).json({ message: 'Sheet not found in workbook' });
        }
        
        const sheet = workbook.Sheets[sheetName];
        
        // Parse the data
        console.log('Parsing Excel sheet data...');
        let data = [];
        
        // Try standard parsing first (expects objects with properties)
        const standardData = xlsx.utils.sheet_to_json(sheet, { 
            raw: false,
            defval: ""
        });
        
        console.log(`Standard parsing found ${standardData.length} rows of data`);
        if (standardData.length > 0) {
            console.log('First row sample:', standardData[0]);
            data = standardData;
        } else {
            // Try array-based parsing (rows of values)
            console.log('Standard parsing yielded no data, trying array-based parsing...');
            const arrayData = xlsx.utils.sheet_to_json(sheet, { 
                header: 1,
                raw: false,
                defval: ""
            });
            
            if (arrayData.length >= 2 && arrayData[0].length > 0) {
                // Use first row as headers
                const headers = arrayData[0];
                console.log('Array parsing headers:', headers);
                
                // Convert remaining rows to objects
                data = arrayData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, i) => {
                        if (header && row[i] !== undefined) {
                            obj[header] = row[i];
                        }
                    });
                    return obj;
                });
                console.log(`Array parsing created ${data.length} objects`);
                if (data.length > 0) {
                    console.log('First row sample:', data[0]);
                }
            }
        }
        
        if (data.length === 0) {
            console.log('Error: No data found in sheet');
            return res.status(400).json({ message: 'No data found in sheet' });
        }
        
        // Start a transaction
        console.log('Starting database transaction...');
        await client.query('BEGIN');
        
        // Process each chapter
        const results = {
            total: data.length,
            inserted: 0,
            duplicates: 0,
            errors: []
        };
        
        console.log(`Processing ${data.length} chapters...`);
        for (const item of data) {
            // Get chapter name from various possible column names
            const chapterName = item.chapter || item.Chapter || item.name || item.Name || item.CHAPTER || item.CHAPTER_NAME || '';
            
            if (!chapterName) {
                console.log('Skipping row due to missing chapter name:', item);
                results.errors.push({ item, error: 'Missing chapter name' });
                continue;
            }
            
            try {
                // Check if chapter already exists
                const existingCheck = await client.query(
                    'SELECT * FROM chapters WHERE LOWER(name) = LOWER($1) AND subject_id = $2',
                    [chapterName.trim(), subjectId]
                );
                
                if (existingCheck.rows.length > 0) {
                    console.log(`Chapter already exists: "${chapterName}"`);
                    results.duplicates++;
                    continue;
                }
                
                // Insert the chapter
                console.log(`Inserting chapter: "${chapterName}" for subject ${subjectId}`);
                const insertResult = await client.query(
                    'INSERT INTO chapters (name, subject_id) VALUES ($1, $2) RETURNING id',
                    [chapterName.trim(), subjectId]
                );
                
                console.log(`Successfully inserted chapter with id: ${insertResult.rows[0].id}`);
                results.inserted++;
            } catch (err) {
                console.error('Error inserting chapter:', err);
                results.errors.push({ item, error: err.message });
            }
        }
        
        // Commit the transaction
        console.log('Committing transaction...');
        await client.query('COMMIT');
        
        // Clean up the file
        console.log('Cleaning up uploaded file...');
        fs.unlinkSync(req.file.path);
        
        // Return the results
        console.log('Upload completed successfully:', results);
        res.status(200).json({
            message: 'Chapter import completed',
            results,
            subject: subjectCheck.rows[0].name,
            class: subjectCheck.rows[0].class_name
        });
    } catch (error) {
        // Rollback in case of error
        console.error('Error in bulk upload process:', error);
        await client.query('ROLLBACK');
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: 'Error importing chapters', error: error.message });
    } finally {
        client.release();
    }
});

// Bulk upload topics from Excel file
router.post('/topics/bulk-upload', authenticateToken, excelUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get chapter_id from form data
        const chapterId = req.body.chapter_id;
        if (!chapterId) {
            return res.status(400).json({ message: 'Chapter ID is required' });
        }

        // Check if chapter exists and get related info
        const chapterCheck = await pool.query(
            `SELECT ch.*, s.name as subject_name, c.name as class_name 
             FROM chapters ch 
             JOIN subjects s ON ch.subject_id = s.id 
             JOIN classes c ON s.class_id = c.id 
             WHERE ch.id = $1`, 
            [chapterId]
        );
        
        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Read Excel file
        const workbook = xlsx.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({ message: 'No data found in the Excel file' });
        }

        let inserted = 0;
        let duplicates = 0;
        const errors = [];

        // Process each row
        for (const row of jsonData) {
            try {
                // Check if topic exists for this chapter
                const topicCheck = await pool.query(
                    'SELECT * FROM topics WHERE name = $1 AND chapter_id = $2',
                    [row.Name, chapterId]
                );
                
                if (topicCheck.rows.length > 0) {
                    duplicates++;
                    continue;
                }
                
                // Insert topic
                await pool.query(
                    'INSERT INTO topics (name, chapter_id, description) VALUES ($1, $2, $3)',
                    [row.Name, chapterId, row.Description || null]
                );
                
                inserted++;
            } catch (err) {
                console.error('Error processing row:', err, row);
                errors.push(`Error processing topic "${row.Name}": ${err.message}`);
            }
        }

        // Delete temp file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'Topics processed successfully',
            results: { total: jsonData.length, inserted, duplicates, errors }
        });
    } catch (err) {
        console.error('Error processing topics upload:', err);
        
        // Clean up temp file if it exists
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: 'Failed to process topics upload', error: err.message });
    }
});

// Add count endpoint for dashboard
router.get('/count', async (req, res) => {
  try {
    // Count all curriculum items (classes + subjects + chapters + topics)
    const classesResult = await pool.query('SELECT COUNT(*) FROM classes');
    const subjectsResult = await pool.query('SELECT COUNT(*) FROM subjects');
    const chaptersResult = await pool.query('SELECT COUNT(*) FROM chapters');
    const topicsResult = await pool.query('SELECT COUNT(*) FROM topics');
    
    const totalCount = 
      parseInt(classesResult.rows[0].count) + 
      parseInt(subjectsResult.rows[0].count) + 
      parseInt(chaptersResult.rows[0].count) +
      parseInt(topicsResult.rows[0].count);
    
    res.json({ count: totalCount });
  } catch (error) {
    console.error('Error counting curriculum items:', error);
    res.status(500).json({ message: 'Error counting curriculum items', error: error.message });
  }
});

module.exports = router; 