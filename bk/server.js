const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('./middleware/authMiddleware');
const pool = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');
const mammoth = require('mammoth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/auth');
const questionsRoute = require('./routes/questions');
const userRoutes = require('./routes/userRoutes');
const curriculumRoutes = require('./routes/curriculum');
const activityRoutes = require('./routes/activity');
const docxUploadRoutes = require('./routes/docxUpload');
const apiRoutes = require('./routes/api');
const coursesRoutes = require('./routes/courses');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Unprotected routes
app.use('/api/auth', authRoutes);

// Set up multer storage for Excel files
const excelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, 'uploads');
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

const excelUpload = multer({ 
    storage: excelStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Direct Excel file analysis endpoint
app.post('/api/test/analyze-excel', excelUpload.single('file'), async (req, res) => {
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
            
            // Try standard parsing first
            const standardData = xlsx.utils.sheet_to_json(sheet, { 
                raw: false,
                defval: ""
            });
            
            if (standardData.length > 0) {
                // We have data with standard parsing
                const headers = Object.keys(standardData[0]);
                const rows = standardData.slice(0, 5).map(row => 
                    headers.map(header => row[header] || '')
                );
                
                preview[sheetName] = {
                    headers,
                    rows
                };
            } else {
                // Try with header:1 option
                const arrayData = xlsx.utils.sheet_to_json(sheet, { 
                    header: 1,
                    raw: false,
                    defval: ""
                });
                
                if (arrayData.length >= 2) {
                    const headers = arrayData[0];
                    const rows = arrayData.slice(1, 6); // Take up to 5 data rows
                    
                    preview[sheetName] = {
                        headers,
                        rows
                    };
                } else if (arrayData.length === 1) {
                    // Only header row exists
                    preview[sheetName] = {
                        headers: arrayData[0],
                        rows: []
                    };
                } else {
                    // Empty sheet
                    preview[sheetName] = {
                        headers: [],
                        rows: []
                    };
                }
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
});

// Import questions from Excel file
app.post('/api/csv/import-excel', authMiddleware, excelUpload.single('file'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('Import Excel request received');
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        if (!req.body.sheetName) {
            return res.status(400).json({ message: 'Sheet name is required' });
        }
        
        console.log('File received:', req.file.path);
        console.log('Selected sheet:', req.body.sheetName);
        
        // Check if we need to override metadata from the form
        const overrideMetadata = req.body.overrideMetadata === 'true';
        const formClassName = req.body.className || '';
        const formSubjectName = req.body.subjectName || '';
        const formChapterName = req.body.chapterName || '';
        
        console.log('Override metadata:', overrideMetadata);
        if (overrideMetadata) {
            console.log('Using form data:', {
                class: formClassName,
                subject: formSubjectName,
                chapter: formChapterName
            });
        }
        
        // First, let's alter the answer column to accept longer text
        try {
            await client.query('ALTER TABLE questions ALTER COLUMN answer TYPE TEXT');
            console.log('Successfully altered answer column to TEXT type');
        } catch (alterError) {
            console.warn('Could not alter answer column:', alterError.message);
            // Continue anyway as the column might already be altered or the user lacks permissions
        }
        
        // Read the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = req.body.sheetName;
        
        if (!workbook.SheetNames.includes(sheetName)) {
            return res.status(400).json({ message: 'Sheet not found in workbook' });
        }
        
        const sheet = workbook.Sheets[sheetName];
        
        // Try different parsing methods
        let data = [];
        
        // First try: standard parsing
        const standardData = xlsx.utils.sheet_to_json(sheet, { 
            raw: false,
            defval: ""
        });
        
        console.log(`Found ${standardData.length} rows with standard parsing`);
        
        if (standardData.length > 0) {
            // Show the first row structure
            console.log('Standard parsing - first row:', JSON.stringify(standardData[0]));
            console.log('Standard parsing - keys:', Object.keys(standardData[0]));
            data = standardData;
        } else {
            // Try with header:1 option
            const arrayData = xlsx.utils.sheet_to_json(sheet, { 
                header: 1,
                raw: false,
                defval: ""
            });
            
            if (arrayData.length >= 2 && arrayData[0].length > 0) {
                // Use first row as headers
                const headers = arrayData[0];
                console.log('Array parsing - headers:', headers);
                
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
                    console.log('Array parsing - first row:', JSON.stringify(data[0]));
                }
            }
        }
        
        if (data.length === 0) {
            return res.status(400).json({ message: 'No data found in sheet' });
        }
        
        // Initialize counters for tracking import results
        let importedCount = 0;
        let errors = [];
        let importedIds = [];
        
        // Process each row with individual transactions
        for (let i = 0; i < data.length; i++) {
            // Start a separate transaction for each row
            const rowClient = await pool.connect();
            
            try {
                await rowClient.query('BEGIN');
                
                const row = data[i];
                
                // Map Excel columns to database fields - accept any available fields
                const questionData = {
                    // If overrideMetadata is true, use form values, otherwise use Excel values
                    subject: overrideMetadata ? formSubjectName : (row.subject || row.Subject || row.SUBJECT || 'N/A'),
                    classname: overrideMetadata ? formClassName : (row.classname || row.class || row.Class || row.CLASS || row['Class Name'] || row.className || 'N/A'),
                    chapter: overrideMetadata ? formChapterName : (row.chapter || row.Chapter || row.CHAPTER || ''),
                    topic: row.topic || row.Topic || row.TOPIC || '',
                    ques: row.ques || row.question || row.Question || row.QUESTION || row.q || row.Q || row.text || row.Text || 'N/A',
                    option_a: row.option_a || row.optionA || row.Option_A || row.OptionA || row.A || row.a || '',
                    option_b: row.option_b || row.optionB || row.Option_B || row.OptionB || row.B || row.b || '',
                    option_c: row.option_c || row.optionC || row.Option_C || row.OptionC || row.C || row.c || '',
                    option_d: row.option_d || row.optionD || row.Option_D || row.OptionD || row.D || row.d || '',
                    answer: row.answer || row.Answer || row.ANSWER || row.correctAnswer || row.correct || '',
                    explanation: row.explanation || row.Explanation || row.EXPLANATION || '',
                    hint: row.hint || row.Hint || row.HINT || '',
                    reference: row.reference || row.Reference || row.REFERENCE || ''
                };
                
                // Preserve LaTeX content by properly escaping
                Object.keys(questionData).forEach(key => {
                    // Handle LaTeX escape sequences properly
                    if (typeof questionData[key] === 'string') {
                        // Preserve raw content without removing backslashes for LaTeX
                        questionData[key] = questionData[key]
                            .replace(/\\r\\n|\\n|\\r/g, '\n') // Convert escaped newlines to actual newlines
                            .replace(/\\t/g, '\t'); // Convert escaped tabs to actual tabs
                    }
                });
                
                // Handle difficulty level specifically
                let difficultyValue = row.difficulty_level || row.difficulty || row.Difficulty || row.DIFFICULTY || '';
                
                // Normalize the difficulty value
                if (difficultyValue) {
                    difficultyValue = difficultyValue.toString().toLowerCase().trim();
                    
                    if (['easy', 'e', 'simple', 'beginner'].includes(difficultyValue)) {
                        questionData.difficulty_level = 'easy';
                    } else if (['medium', 'm', 'moderate', 'intermediate', 'normal', 'average'].includes(difficultyValue)) {
                        questionData.difficulty_level = 'medium';
                    } else if (['hard', 'h', 'difficult', 'challenging', 'advanced'].includes(difficultyValue)) {
                        questionData.difficulty_level = 'hard';
                    } else {
                        // Use original value if it doesn't match any of our normalized categories
                        questionData.difficulty_level = difficultyValue;
                    }
                } else {
                    // Leave difficulty empty if none provided
                    questionData.difficulty_level = '';
                }
                
                console.log(`Row ${i+2} difficulty: ${questionData.difficulty_level} (from original: ${difficultyValue || 'none'})`);
                
                console.log(`Inserting row ${i+2}`);
                
                // Insert question into database
                const insertQuery = `
                    INSERT INTO questions (
                        subject, classname, chapter, topic, ques, 
                        option_a, option_b, option_c, option_d, answer, 
                        explanation, hint, difficulty_level, reference
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, $9, $10, 
                        $11, $12, $13, $14
                    ) RETURNING id
                `;
                
                const values = [
                    questionData.subject, questionData.classname, questionData.chapter, 
                    questionData.topic, questionData.ques, questionData.option_a, 
                    questionData.option_b, questionData.option_c, questionData.option_d, 
                    questionData.answer, questionData.explanation, questionData.hint, 
                    questionData.difficulty_level, questionData.reference
                ];
                
                const result = await rowClient.query(insertQuery, values);
                console.log(`Inserted row ${i+2} with ID:`, result.rows[0].id);
                
                // Store the inserted question ID
                importedIds.push(result.rows[0].id);
                
                // Commit this row's transaction
                await rowClient.query('COMMIT');
                importedCount++;
            } catch (error) {
                // Rollback this row's transaction
                await rowClient.query('ROLLBACK');
                
                console.error(`Error inserting row ${i+2}:`, error);
                errors.push({
                    row: i + 2,
                    error: error.message
                });
            } finally {
                // Release the client for this row
                rowClient.release();
            }
        }
        
        console.log(`Import completed: ${importedCount} rows imported, ${errors.length} errors`);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        return res.status(200).json({
            message: 'Import completed',
            importedCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            importedIds: importedIds
        });
    } catch (error) {
        console.error('Error importing questions:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ message: 'Error importing questions', error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
});

// Route for CSV template - doesn't require authentication
app.use('/api/csv/template', (req, res) => {
    // Define CSV header row
    const csvHeader = 'qserial,subject,classname,chapter,topic,ques,option_a,option_b,option_c,option_d,answer,explanation,hint,difficulty_level,reference';
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=question_template.csv');
    
    // Send CSV header as the file content
    res.send(csvHeader);
});

// Add direct API routes used by the frontend components
app.use('/api', apiRoutes);

// Protected routes
app.use('/api/questions', authMiddleware, questionsRoute);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/curriculum', authMiddleware, curriculumRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);
app.use('/api/docx', authMiddleware, docxUploadRoutes);
app.use('/api/courses', coursesRoutes);

// Add a global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Log detailed error information for debugging
  console.error({
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    requestUrl: req.originalUrl,
    requestMethod: req.method,
    requestHeaders: req.headers,
    requestBody: req.body
  });
  
  // Clean up any temporary files that might be left behind
  if (req.file && req.file.path) {
    try {
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      console.log(`Cleaned up temporary file: ${req.file.path}`);
    } catch (e) {
      console.error('Failed to delete temp file:', e);
    }
  }
  
  // Send a user-friendly error response
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
    path: req.originalUrl
  });
});

// Handle 404s for undefined routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;