const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const mammoth = require('mammoth');

// Set up multer storage for DOCX files
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
        cb(null, 'docx-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow DOCX files
const fileFilter = (req, file, cb) => {
    const filetypes = /docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only Word documents (.docx) are allowed!'), false);
    }
};

// Set up multer upload
const docxUpload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route to analyze DOCX file
router.post('/analyze', authMiddleware, docxUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { classId, subjectId, className, subjectName } = req.body;
        
        console.log("Analyzing DOCX file:", req.file.path);
        
        // First try the Python script if available
        let mcqs = await tryPythonScript(req.file.path, className, subjectName);
        
        if (mcqs && mcqs.length > 0) {
            console.log(`Python script extracted ${mcqs.length} MCQs`);
            
            // Return the extracted MCQs as preview
            return res.status(200).json({
                message: 'DOCX file analyzed successfully using Python script',
                preview: mcqs
            });
        }
        
        // Python script didn't work, try JavaScript approach
        console.log("Python script unavailable or didn't find MCQs, using JavaScript approach");
        
        // Convert DOCX to HTML using mammoth.js with full trace
        const result = await mammoth.convertToHtml({ 
            path: req.file.path,
            transformDocument: mammoth.transforms.getDebugInfo
        });
        
        const html = result.value;
        const messages = result.messages;
        
        console.log("Converted DOCX to HTML");
        console.log("Conversion messages:", messages);
        console.log("HTML sample (first 500 chars):", html.substring(0, 500));
        
        // Use a more flexible extraction approach
        
        // Try multiple extraction strategies
        // Strategy 1: Our standard extractor
        mcqs = extractMCQsFromHTML(html, className, subjectName);
        console.log(`Strategy 1: Extracted ${mcqs.length} MCQs`);
        
        // If no MCQs found, try fallback strategy
        if (mcqs.length === 0) {
            console.log("No MCQs found with standard strategy, trying fallback extraction");
            mcqs = fallbackExtractMCQs(html, className, subjectName);
            console.log(`Fallback strategy: Extracted ${mcqs.length} MCQs`);
        }
        
        // If still no MCQs, try raw text approach with even more lenient parsing
        if (mcqs.length === 0) {
            console.log("No MCQs found with fallback, trying raw text approach");
            mcqs = rawTextExtractMCQs(html, className, subjectName);
            console.log(`Raw approach: Extracted ${mcqs.length} MCQs`);
        }
        
        // If STILL no MCQs, dump the full content for debugging
        if (mcqs.length === 0) {
            console.log("No MCQs found with any strategy. Dumping full content for debugging.");
            
            // Write the HTML content to a debug file
            const debugDir = path.join(__dirname, '../debug');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            
            const debugPath = path.join(debugDir, `debug_${Date.now()}.html`);
            fs.writeFileSync(debugPath, html);
            console.log(`Saved debug HTML to ${debugPath}`);
            
            const plainText = htmlToPlainText(html);
            const debugTextPath = path.join(debugDir, `debug_${Date.now()}.txt`);
            fs.writeFileSync(debugTextPath, plainText);
            console.log(`Saved debug text to ${debugTextPath}`);
            
            // Create some dummy MCQs just to show the document was processed
            mcqs = createDummyMCQs(plainText, className, subjectName);
        }
        
        // Return the extracted MCQs as preview
        return res.status(200).json({
            message: 'DOCX file analyzed successfully',
            preview: mcqs
        });
    } catch (error) {
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Error in DOCX analysis route:', error);
        return res.status(500).json({ 
            message: 'Server error analyzing DOCX file',
            error: error.message
        });
    }
});

// Route to import MCQs from DOCX file
router.post('/import', authMiddleware, docxUpload.single('file'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { classId, subjectId, className, subjectName } = req.body;
        
        if (!classId || !subjectId) {
            return res.status(400).json({ message: 'Class ID and Subject ID are required' });
        }
        
        console.log("Processing DOCX file for import:", req.file.path);
        
        // First try the Python script if available
        let mcqs = await tryPythonScript(req.file.path, className, subjectName);
        
        if (!mcqs || mcqs.length === 0) {
            console.log("Python script unavailable or didn't find MCQs, using JavaScript approach");
            
            // Convert DOCX to HTML using mammoth.js
            const result = await mammoth.convertToHtml({ path: req.file.path });
            const html = result.value;
            
            console.log("Converted DOCX to HTML");
            
            // Try multiple extraction strategies
            // Strategy 1: Our standard extractor
            mcqs = extractMCQsFromHTML(html, className, subjectName);
            console.log(`Strategy 1: Extracted ${mcqs.length} MCQs`);
            
            // If no MCQs found, try fallback strategy
            if (mcqs.length === 0) {
                console.log("No MCQs found with standard strategy, trying fallback extraction");
                mcqs = fallbackExtractMCQs(html, className, subjectName);
                console.log(`Fallback strategy: Extracted ${mcqs.length} MCQs`);
            }
            
            // If still no MCQs, try raw text approach with even more lenient parsing
            if (mcqs.length === 0) {
                console.log("No MCQs found with fallback, trying raw text approach");
                mcqs = rawTextExtractMCQs(html, className, subjectName);
                console.log(`Raw approach: Extracted ${mcqs.length} MCQs`);
            }
        } else {
            console.log(`Python script extracted ${mcqs.length} MCQs for import`);
        }
        
        // If no MCQs found with any method, return error
        if (!mcqs || mcqs.length === 0) {
            return res.status(400).json({
                message: 'No MCQs could be extracted from the document. Please check the format.'
            });
        }
        
        console.log(`Proceeding to import ${mcqs.length} MCQs`);
        
        // Begin transaction for inserting MCQs
        await client.query('BEGIN');
        
        // Initialize counters for tracking import results
        let insertedCount = 0;
        let duplicateCount = 0;
        
        // Process each MCQ
        for (const mcq of mcqs) {
            try {
                // Check if this MCQ already exists (prevent duplicates)
                const duplicateCheck = await client.query(
                    `SELECT id FROM questions WHERE 
                    classname = $1 AND 
                    subject = $2 AND 
                    ques = $3`,
                    [className || mcq.Class, subjectName || mcq.Subject, mcq.Question]
                );
                
                if (duplicateCheck.rows.length > 0) {
                    console.log(`Duplicate MCQ found: ${mcq.Question.substring(0, 30)}...`);
                    duplicateCount++;
                    continue;
                }
                
                // Insert the MCQ
                await client.query(
                    `INSERT INTO questions
                    (classname, subject, chapter, topic, ques, 
                    option_a, option_b, option_c, option_d, answer, 
                    explanation, hint, difficulty_level, reference) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [
                        className || mcq.Class, 
                        subjectName || mcq.Subject, 
                        mcq.Chapter || mcq.Topic || '', 
                        mcq.Topic || '', 
                        mcq.Question,
                        mcq.OptionA, 
                        mcq.OptionB, 
                        mcq.OptionC, 
                        mcq.OptionD,
                        mcq.Answer, 
                        mcq.Explaination || '', 
                        mcq.Hint || '', 
                        mcq.Difficulty_level || 'medium',
                        mcq['Reference_Board/Institute'] || ''
                    ]
                );
                
                insertedCount++;
            } catch (error) {
                console.error('Error inserting MCQ:', error);
                // Continue with next MCQ, don't fail entire import
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        // Clean up the uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(200).json({
            message: 'MCQs imported successfully',
            inserted: insertedCount,
            duplicates: duplicateCount,
            total: mcqs.length
        });
        
    } catch (error) {
        // Rollback transaction
        await client.query('ROLLBACK');
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Error in DOCX import route:', error);
        return res.status(500).json({ 
            message: 'Server error importing MCQs',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Extract MCQs from HTML content
 * @param {string} html - HTML content from the DOCX file
 * @param {string} className - Class name to assign to MCQs
 * @param {string} subjectName - Subject name to assign to MCQs
 * @returns {Array} Array of MCQ objects
 */
function extractMCQsFromHTML(html, className, subjectName) {
    console.log("Extracting MCQs from HTML");
    
    // Convert HTML to plain text to make parsing easier
    let text = htmlToPlainText(html);
    
    console.log("HTML converted to plain text");
    
    // Define regex patterns for MCQ extraction - improved patterns based on the Python code
    // Regex for "Serial. question" - both Bengali and English numerals
    // This handles both Bengali (০-৯) and English (0-9) numerals
    const mcqPattern = /([\d০-৯]+)[\.\s\)\,।][\s\n]*(.*?)(?=\n\s*(?:[\d০-৯]+[\.\s\)\,।]|[A-Da-dক-ঘ][\.\)\s])|$)/gs;
    
    // Regex for options: both "A." style and "ক." Bengali style
    const optionPattern = /([A-Da-dক-ঘ])[\.\)\s][\s\n]*(.*?)(?=\n\s*[A-Da-dক-ঘ][\.\)\s]|\n\s*(?:[Aa]nswer|উত্তর)[:ঃ]|\n\s*[\d০-৯]+[\.\s\)\,।]|$)/gs;
    
    // Regex for answer: both "Answer:" and "উত্তর:" Bengali style
    const answerPattern = /(?:[Aa]nswer|উত্তর)[:ঃ][\s\n]*(.*?)(?=\n\s*(?:\[|[\d০-৯]+[\.\s\)\,।]|$))/gs;
    
    // More comprehensive topic patterns
    const topicPattern = /\[(?:[Tt]opic[:ঃ]|টপিক[:ঃ])[\s\n]*(.*?)(?:\]|$)/gs;
    const topicAltPattern = /\[(.*?(?:[Tt]opic|[Ss]ubject|[Cc]hapter|টপিক).*?)(?:\]|$)/gs;
    
    // Difficulty pattern
    const difficultyPattern = /\[(Easy|Medium|Hard|.*?[Dd]ifficulty.*?)(?:\]|$)/gs;
    
    // Board/Institute pattern
    const boardPattern = /\[(.*?(?:[Bb]oard|[Ii]nstitute|[Rr]eference).*?)(?:\]|$)/gs;
    
    // Explanation and hint patterns
    const explanationPattern = /\[(?:[Ee]xplaination|[Ee]xplanation)[:ঃ][\s\n]*(.*?)(?:\]|$)/gs;
    const hintPattern = /\[(?:[Hh]int)[:ঃ][\s\n]*(.*?)(?:\]|$)/gs;
    
    // Initialize array for MCQs
    const mcqs = [];
    
    // Log a sample of the text for debugging
    console.log("Text sample (first 300 chars):", text.substring(0, 300));
    
    // First pass: Find all MCQ matches in the text
    let match;
    const mcqMatches = {};
    let mcqCount = 0;
    
    while ((match = mcqPattern.exec(text)) !== null) {
        mcqCount++;
        const serialNumber = match[1];
        const questionText = match[2].trim();
        
        console.log(`Found MCQ #${mcqCount} with serial ${serialNumber}`);
        
        // Store the question position in text
        mcqMatches[serialNumber] = {
            Serial: serialNumber,
            Question: questionText,
            startPosition: match.index,
            endPosition: mcqPattern.lastIndex,
            Class: className || '',
            Subject: subjectName || ''
        };
    }
    
    console.log(`Found ${Object.keys(mcqMatches).length} potential MCQs`);
    
    // No MCQs found, try another approach with more lenient patterns
    if (Object.keys(mcqMatches).length === 0) {
        console.log("No MCQs found with primary pattern, trying alternative approach");
        // Reset regex
        mcqPattern.lastIndex = 0;
        
        // Create sections based on numeric prefixes and option blocks
        const sections = text.split(/\n\s*(?=[\d০-৯]+[\.\s\)\,।])/g);
        
        console.log(`Split text into ${sections.length} sections`);
        
        // Process each section that looks like an MCQ
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            
            // Skip short sections
            if (section.length < 20) continue;
            
            // Try to extract serial number from the beginning
            const serialMatch = section.match(/^([\d০-৯]+)[\.\s\)\,।]/);
            if (!serialMatch) continue;
            
            const serialNumber = serialMatch[1];
            
            // Try to find options in this section
            const hasOptions = section.match(/(?:[A-Da-dক-ঘ])[\.\)\s][\s\n]/g);
            if (!hasOptions || hasOptions.length < 2) continue; // Need at least 2 options
            
            console.log(`Found MCQ section with serial ${serialNumber}`);
            
            // Extract question text - everything before the first option
            const questionMatch = section.match(/^(?:[\d০-৯]+)[\.\s\)\,।][\s\n]*(.*?)(?=\n\s*[A-Da-dক-ঘ][\.\)\s])/s);
            const questionText = questionMatch ? questionMatch[1].trim() : section.substring(0, 100) + "...";
            
            mcqMatches[serialNumber] = {
                Serial: serialNumber,
                Question: questionText,
                fullText: section,
                Class: className || '',
                Subject: subjectName || ''
            };
            
            mcqCount++;
        }
        
        console.log(`Found ${Object.keys(mcqMatches).length} MCQs with alternative approach`);
    }
    
    // Process each MCQ to extract options, answer, etc.
    for (const serialNumber in mcqMatches) {
        const mcq = mcqMatches[serialNumber];
        
        // Get the text segment for this MCQ
        let mcqText;
        if (mcq.fullText) {
            // If we're using the alternative approach
            mcqText = mcq.fullText;
        } else {
            // Get the text segment for this MCQ from the original approach
            const startPos = mcq.startPosition;
            let endPos = mcq.endPosition;
            
            // Find the next MCQ if any
            const nextSerialNumber = Object.keys(mcqMatches).find(serial => 
                mcqMatches[serial].startPosition > startPos && 
                mcqMatches[serial].startPosition < endPos
            );
            
            if (nextSerialNumber) {
                endPos = mcqMatches[nextSerialNumber].startPosition;
            }
            
            // Extract the text segment for this MCQ
            mcqText = text.substring(startPos, endPos);
        }
        
        console.log(`Processing MCQ ${serialNumber} text (${mcqText.length} chars)`);
        
        // Extract topic - try both patterns
        let topicMatch;
        topicPattern.lastIndex = 0;
        if ((topicMatch = topicPattern.exec(mcqText)) !== null) {
            mcq.Topic = topicMatch[1].trim();
        } else {
            topicAltPattern.lastIndex = 0;
            if ((topicMatch = topicAltPattern.exec(mcqText)) !== null) {
                mcq.Topic = topicMatch[1].trim();
            }
        }
        
        // Extract difficulty
        let difficultyMatch;
        difficultyPattern.lastIndex = 0;
        if ((difficultyMatch = difficultyPattern.exec(mcqText)) !== null) {
            mcq.Difficulty_level = difficultyMatch[1].trim();
        }
        
        // Extract board/institute
        let boardMatch;
        boardPattern.lastIndex = 0;
        if ((boardMatch = boardPattern.exec(mcqText)) !== null) {
            mcq['Reference_Board/Institute'] = boardMatch[1].trim();
        }
        
        // Extract options
        const options = {};
        let optionMatch;
        optionPattern.lastIndex = 0;
        
        // Map Bengali option letters to English
        const bengaliToEnglish = {
            'ক': 'A',
            'খ': 'B',
            'গ': 'C',
            'ঘ': 'D'
        };
        
        while ((optionMatch = optionPattern.exec(mcqText)) !== null) {
            let optionLetter = optionMatch[1].trim();
            // Convert Bengali option letter to English if needed
            if (bengaliToEnglish[optionLetter]) {
                optionLetter = bengaliToEnglish[optionLetter];
            }
            
            const optionText = optionMatch[2].trim();
            
            if (optionLetter === 'A') mcq.OptionA = optionText;
            else if (optionLetter === 'B') mcq.OptionB = optionText;
            else if (optionLetter === 'C') mcq.OptionC = optionText;
            else if (optionLetter === 'D') mcq.OptionD = optionText;
        }
        
        // Extract answer
        let answerMatch;
        answerPattern.lastIndex = 0;
        if ((answerMatch = answerPattern.exec(mcqText)) !== null) {
            let answer = answerMatch[1].trim();
            
            // Convert Bengali answer to English if needed
            for (const bn in bengaliToEnglish) {
                if (answer.includes(bn)) {
                    answer = answer.replace(bn, bengaliToEnglish[bn]);
                }
            }
            
            mcq.Answer = answer;
        }
        
        // Extract explanation
        let explanationMatch;
        explanationPattern.lastIndex = 0;
        if ((explanationMatch = explanationPattern.exec(mcqText)) !== null) {
            mcq.Explaination = explanationMatch[1].trim();
        }
        
        // Extract hint
        let hintMatch;
        hintPattern.lastIndex = 0;
        if ((hintMatch = hintPattern.exec(mcqText)) !== null) {
            mcq.Hint = hintMatch[1].trim();
        }
        
        // Clean up any temporary properties we added to the MCQ object
        delete mcq.startPosition;
        delete mcq.endPosition;
        delete mcq.fullText;
        
        // Make sure we have all required fields
        if (!mcq.OptionA) mcq.OptionA = '';
        if (!mcq.OptionB) mcq.OptionB = '';
        if (!mcq.OptionC) mcq.OptionC = '';
        if (!mcq.OptionD) mcq.OptionD = '';
        if (!mcq.Answer) mcq.Answer = '';
        
        // Add to results if it has at least question, options, and answer
        if (mcq.Question && (mcq.OptionA || mcq.OptionB || mcq.OptionC || mcq.OptionD)) {
            // Add the MCQ to the result array
            mcqs.push(mcq);
        }
        
        // Reset all regex indices
        topicPattern.lastIndex = 0;
        topicAltPattern.lastIndex = 0;
        difficultyPattern.lastIndex = 0;
        boardPattern.lastIndex = 0;
        optionPattern.lastIndex = 0;
        answerPattern.lastIndex = 0;
        explanationPattern.lastIndex = 0;
        hintPattern.lastIndex = 0;
    }
    
    console.log(`Extracted ${mcqs.length} valid MCQs from document`);
    
    // Sort MCQs by serial number
    mcqs.sort((a, b) => {
        // Convert Bengali numerals to English if needed
        const numA = parseInt(convertBengaliDigitsToEnglish(a.Serial));
        const numB = parseInt(convertBengaliDigitsToEnglish(b.Serial));
        return numA - numB;
    });
    
    return mcqs;
}

/**
 * Convert HTML to plain text - improved version to better preserve formatting
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function htmlToPlainText(html) {
    // Add newlines for block elements before removing tags
    let text = html
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<li[^>]*>/gi, '\n- ')
        .replace(/<h[1-6][^>]*>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n');
    
    // Remove remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
    
    // Replace multiple consecutive newlines with a single newline
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Normalize whitespace (but preserve newlines)
    text = text.replace(/[ \t]+/g, ' ');
    
    // Add markers for MCQ patterns to make them easier to detect
    // Questions (handle both Bengali and English numerals)
    text = text.replace(/(\d+|[০-৯]+)[\.\s\)\,।]/g, '\n$1. ');
    
    // Options (both English and Bengali)
    text = text.replace(/([A-Da-dক-ঘ])[\.\)\s]/g, '\n$1. ');
    
    // Answer markers
    text = text.replace(/(Answer|উত্তর)[:ঃ]/gi, '\nAnswer: ');
    
    // Square bracket markers
    text = text.replace(/\[Topic:/gi, '\n[Topic:');
    text = text.replace(/\[টপিক:/g, '\n[টপিক:');
    text = text.replace(/\[Explaination:/gi, '\n[Explaination:');
    text = text.replace(/\[Explanation:/gi, '\n[Explanation:');
    text = text.replace(/\[Hint:/gi, '\n[Hint:');
    text = text.replace(/\[Difficulty:/gi, '\n[Difficulty:');
    text = text.replace(/\[Easy\]/gi, '\n[Easy]');
    text = text.replace(/\[Medium\]/gi, '\n[Medium]');
    text = text.replace(/\[Hard\]/gi, '\n[Hard]');
    text = text.replace(/\[Reference:/gi, '\n[Reference:');
    text = text.replace(/\[Board:/gi, '\n[Board:');
    text = text.replace(/\[Institute:/gi, '\n[Institute:');
    
    return text;
}

/**
 * Convert Bengali digits to English
 * @param {string} text - Text containing Bengali digits
 * @returns {string} Text with Bengali digits converted to English
 */
function convertBengaliDigitsToEnglish(text) {
    if (!text) return text;
    
    const bengaliToEnglish = {
        '০': '0', 
        '১': '1', 
        '২': '2', 
        '৩': '3', 
        '৪': '4', 
        '৫': '5', 
        '৬': '6', 
        '৭': '7', 
        '৮': '8', 
        '৯': '9'
    };
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        result += bengaliToEnglish[char] || char;
    }
    
    return result;
}

/**
 * Fallback MCQ extraction from HTML using a more lenient approach
 */
function fallbackExtractMCQs(html, className, subjectName) {
    const text = htmlToPlainText(html);
    console.log("Fallback extraction - Text length:", text.length);
    
    // Look for numbered items followed by options
    const sections = text.split(/\n\s*\d+[\.\s]/);
    console.log(`Fallback: Split into ${sections.length} sections`);
    
    const mcqs = [];
    
    // Simple pattern to identify option blocks (A/B/C/D)
    const hasOptionPattern = /\n\s*[A-D][\.\)\s]/i;
    
    // Identify sections that have A/B/C/D option patterns
    for (let i = 1; i < sections.length; i++) { // Start from 1 to skip the pre-content
        const section = sections[i].trim();
        
        // Skip short sections
        if (section.length < 20) continue;
        
        // Check if this section contains options
        if (hasOptionPattern.test(section)) {
            console.log(`Fallback: Found potential MCQ section ${i} (length: ${section.length})`);
            
            // Extract question and options
            const lines = section.split('\n').map(line => line.trim()).filter(line => line);
            
            // First line is likely the question
            const question = lines[0];
            
            // Look for option lines
            const optionA = extractOptionText(lines, 'A');
            const optionB = extractOptionText(lines, 'B');
            const optionC = extractOptionText(lines, 'C');
            const optionD = extractOptionText(lines, 'D');
            
            // Look for answer
            const answerLine = lines.find(line => 
                line.toLowerCase().startsWith('answer') || 
                line.includes('উত্তর')
            );
            const answer = answerLine ? 
                answerLine.replace(/^[^:]*:/, '').trim() : '';
            
            // Create MCQ if we have at least a question and some options
            if (question && (optionA || optionB || optionC || optionD)) {
                mcqs.push({
                    Serial: i.toString(),
                    Question: question,
                    OptionA: optionA || '',
                    OptionB: optionB || '',
                    OptionC: optionC || '',
                    OptionD: optionD || '',
                    Answer: answer || '',
                    Class: className || '',
                    Subject: subjectName || ''
                });
                
                console.log(`Fallback: Added MCQ with question: ${question.substring(0, 50)}...`);
            }
        }
    }
    
    return mcqs;
}

/**
 * Extract the text for an option letter from an array of lines
 */
function extractOptionText(lines, letter) {
    const regex = new RegExp(`^\\s*${letter}[\\.\\)\\s]\\s*(.+)`, 'i');
    const optionLine = lines.find(line => regex.test(line));
    return optionLine ? optionLine.replace(regex, '$1').trim() : '';
}

/**
 * Raw text based approach for MCQ extraction
 */
function rawTextExtractMCQs(html, className, subjectName) {
    // Strip all HTML to get pure text
    const text = html.replace(/<[^>]*>/g, ' ')
                     .replace(/&nbsp;/g, ' ')
                     .replace(/\s+/g, ' ');
    
    console.log("Raw text length:", text.length);
    
    // Split text by digit-dot patterns (1., 2., etc.)
    const questionPattern = /(\d+)\.\s+([^0-9]+?)(?=\s+\d+\.|$)/g;
    const mcqs = [];
    let match;
    
    while ((match = questionPattern.exec(text)) !== null) {
        const serialNumber = match[1];
        let questionText = match[2].trim();
        
        console.log(`Raw: Found potential question ${serialNumber}`);
        
        // Extract options and answer from question text
        const optionMatches = questionText.match(/\b([A-D])[\.)\s]\s*([^A-D]+?)(?=\s+[A-D][\.)\s]|$)/g) || [];
        
        const options = {};
        optionMatches.forEach(optionStr => {
            const optionMatch = optionStr.match(/\b([A-D])[\.)\s]\s*(.*)/);
            if (optionMatch) {
                const letter = optionMatch[1];
                const text = optionMatch[2].trim();
                options[letter] = text;
            }
        });
        
        // Clean up question text to remove options
        if (optionMatches.length > 0) {
            const firstOptionStart = questionText.indexOf(optionMatches[0]);
            if (firstOptionStart > 0) {
                questionText = questionText.substring(0, firstOptionStart).trim();
            }
        }
        
        // Only add if we found at least question and one option
        if (questionText && Object.keys(options).length > 0) {
            mcqs.push({
                Serial: serialNumber,
                Question: questionText,
                OptionA: options['A'] || '',
                OptionB: options['B'] || '',
                OptionC: options['C'] || '',
                OptionD: options['D'] || '',
                Answer: '', // We can't reliably find the answer this way
                Class: className || '',
                Subject: subjectName || ''
            });
            
            console.log(`Raw: Added MCQ with question: ${questionText.substring(0, 50)}...`);
        }
    }
    
    return mcqs;
}

/**
 * Create some dummy MCQs from document text
 * Used only for debugging when no MCQs are found
 */
function createDummyMCQs(text, className, subjectName) {
    console.log("Creating dummy MCQs for debugging");
    
    // Find paragraphs with more than 30 characters as potential questions
    const paragraphs = text.split('\n\n')
                           .map(p => p.trim())
                           .filter(p => p.length > 30);
    
    // Take up to 5 paragraphs
    const potentialQuestions = paragraphs.slice(0, 5);
    
    return potentialQuestions.map((text, i) => {
        // Limit text to 100 chars for preview
        const questionText = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        
        return {
            Serial: (i+1).toString(),
            Question: questionText,
            OptionA: 'PLACEHOLDER OPTION A - Document parsing failed',
            OptionB: 'PLACEHOLDER OPTION B - Document parsing failed',
            OptionC: 'PLACEHOLDER OPTION C - Document parsing failed',
            OptionD: 'PLACEHOLDER OPTION D - Document parsing failed',
            Answer: '[DEBUG] No answer found',
            Class: className || '',
            Subject: subjectName || '',
            _debug: 'This is a placeholder MCQ. Document parsing failed to detect MCQs. Check server logs.'
        };
    });
}

/**
 * Try to use the Python script if it's available
 */
async function tryPythonScript(docxFile, className, subjectName) {
    return new Promise((resolve) => {
        // Timeout after 10 seconds
        const timeoutId = setTimeout(() => {
            console.log("Python script timeout - taking too long");
            resolve(null);
        }, 10000);
        
        try {
            // Check if python script exists
            const scriptPath = path.join(__dirname, '../docx_to_mcq.py');
            if (!fs.existsSync(scriptPath)) {
                console.log("Python script not found:", scriptPath);
                clearTimeout(timeoutId);
                resolve(null);
                return;
            }
            
            console.log("Trying Python script:", scriptPath);
            
            // Try to execute the Python script
            const { spawn } = require('child_process');
            const pythonProcess = spawn('python', [
                scriptPath,
                docxFile,
                className || '',
                subjectName || ''
            ]);
            
            let pythonOutput = '';
            let pythonError = '';
            
            pythonProcess.stdout.on('data', (data) => {
                pythonOutput += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                pythonError += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    console.error(`Python error output: ${pythonError}`);
                    resolve(null);
                    return;
                }
                
                try {
                    // Extract JSON data from Python output
                    const jsonStartIndex = pythonOutput.indexOf('[{');
                    const jsonEndIndex = pythonOutput.lastIndexOf('}]') + 2;
                    
                    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                        const jsonData = pythonOutput.substring(jsonStartIndex, jsonEndIndex);
                        const mcqData = JSON.parse(jsonData);
                        
                        // Successfully extracted MCQs using the Python script
                        console.log(`Successfully parsed ${mcqData.length} MCQs from Python script`);
                        resolve(mcqData);
                    } else {
                        console.log('No valid JSON found in Python output');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing Python output:', error);
                    resolve(null);
                }
            });
            
            pythonProcess.on('error', (error) => {
                clearTimeout(timeoutId);
                console.error('Error spawning Python process:', error);
                resolve(null);
            });
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error trying Python script:', error);
            resolve(null);
        }
    });
}

module.exports = router; 