const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const pool = require('../db');

// Set up multer storage for Excel files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow Excel files
const fileFilter = (req, file, cb) => {
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.mimetype === 'application/vnd.ms-excel';
    
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only Excel files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Separate handler functions that can be exported directly
const handle_analyze_excel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Read the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheets = workbook.SheetNames;
        
        // Prepare preview data for each sheet
        const preview = {};
        
        for (const sheetName of sheets) {
            const sheet = workbook.Sheets[sheetName];
            
            // Convert sheet to JSON with header row
            const data = xlsx.utils.sheet_to_json(sheet, { 
                header: 1,
                raw: false,
                defval: ""
            });
            
            // Take headers (first row) and up to 5 rows of data for preview
            if (data.length > 0) {
                const headers = data[0];
                const rows = data.slice(1, 6); // Get up to 5 rows for preview
                
                preview[sheetName] = {
                    headers,
                    rows
                };
            }
        }
        
        // Remove file after analysis
        fs.unlinkSync(req.file.path);
        
        return res.status(200).json({
            filename: req.file.originalname,
            sheets,
            preview
        });
    } catch (error) {
        console.error('Error analyzing Excel file:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ message: 'Error analyzing Excel file', error: error.message });
    }
};

const handle_import_excel = async (req, res) => {
    const client = await pool.connect();
    
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        if (!req.body.sheetName) {
            return res.status(400).json({ message: 'Sheet name is required' });
        }
        
        // Read the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = req.body.sheetName;
        
        if (!workbook.SheetNames.includes(sheetName)) {
            return res.status(400).json({ message: 'Sheet not found in workbook' });
        }
        
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { 
            raw: false,
            defval: ""
        });
        
        if (data.length === 0) {
            return res.status(400).json({ message: 'No data found in sheet' });
        }
        
        await client.query('BEGIN');
        
        // Get user ID from auth token
        const userId = req.user.id;
        
        // Initialize counters for tracking import results
        let importedCount = 0;
        let errors = [];
        
        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Map Excel columns to database fields
            const questionData = {
                subject: row.subject || '',
                classname: row.classname || row.class || '',
                chapter: row.chapter || '',
                topic: row.topic || '',
                ques: row.ques || row.question || '',
                option_a: row.option_a || row.A || '',
                option_b: row.option_b || row.B || '',
                option_c: row.option_c || row.C || '',
                option_d: row.option_d || row.D || '',
                answer: row.answer || '',
                explanation: row.explanation || '',
                hint: row.hint || '',
                difficulty_level: row.difficulty_level || row.difficulty || 'medium',
                reference: row.reference || '',
                created_by: userId
            };
            
            // Skip rows with missing required fields
            if (!questionData.ques || !questionData.subject || !questionData.classname) {
                errors.push({
                    row: i + 2, // +2 because 1-indexed and header row
                    error: 'Missing required fields (question, subject, or class)'
                });
                continue;
            }
            
            try {
                // Insert question into database
                const insertQuery = `
                    INSERT INTO questions (
                        subject, classname, chapter, topic, ques, 
                        option_a, option_b, option_c, option_d, answer, 
                        explanation, hint, difficulty_level, reference, created_by
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, $9, $10, 
                        $11, $12, $13, $14, $15
                    ) RETURNING id
                `;
                
                const values = [
                    questionData.subject, questionData.classname, questionData.chapter, 
                    questionData.topic, questionData.ques, questionData.option_a, 
                    questionData.option_b, questionData.option_c, questionData.option_d, 
                    questionData.answer, questionData.explanation, questionData.hint, 
                    questionData.difficulty_level, questionData.reference, questionData.created_by
                ];
                
                await client.query(insertQuery, values);
                importedCount++;
            } catch (error) {
                errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }
        
        await client.query('COMMIT');
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        return res.status(200).json({
            message: 'Import completed',
            importedCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error importing questions:', error);
        
        // Rollback transaction if error occurs
        await client.query('ROLLBACK');
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ message: 'Error importing questions', error: error.message });
    } finally {
        client.release();
    }
};

// Attach handler functions to router endpoints
router.post('/analyze-excel', upload.single('file'), handle_analyze_excel);
router.post('/import-excel', upload.single('file'), handle_import_excel);

// Export the router for Express middleware usage
module.exports = router;

// Also export direct handler functions
module.exports.handle_analyze_excel = handle_analyze_excel;
module.exports.handle_import_excel = handle_import_excel; 