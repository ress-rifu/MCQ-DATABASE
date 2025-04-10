const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Smart answer matching function
const findBestMatchingOption = (answer, options) => {
  console.log('Smart answer matching for answer:', answer);
  console.log('Available options:', options);
  
  if (!answer) return null;
  
  // If answer is already A, B, C, or D, return it directly
  if (['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
    console.log('Answer is already an option letter:', answer.toUpperCase());
    return answer.toUpperCase();
  }
  
  // Clean the answer text by removing $ signs and whitespace
  const cleanAnswer = (text) => {
    if (!text) return '';
    return text.replace(/\$/g, '').replace(/\s+/g, '').toLowerCase();
  };
  
  const cleanedAnswer = cleanAnswer(answer);
  console.log('Cleaned answer:', cleanedAnswer);
  
  // Check for exact matches first
  for (const [option, text] of Object.entries(options)) {
    const cleanedOption = cleanAnswer(text);
    console.log(`Comparing with option ${option}:`, cleanedOption);
    
    if (cleanedAnswer === cleanedOption) {
      console.log('Found exact match with option:', option);
      return option.toUpperCase();
    }
  }
  
  // If no exact match, look for partial matches
  let bestMatch = null;
  let bestMatchScore = 0;
  
  for (const [option, text] of Object.entries(options)) {
    const cleanedOption = cleanAnswer(text);
    
    // Skip empty options
    if (!cleanedOption) continue;
    
    // Calculate similarity score (simple contains check)
    if (cleanedOption.includes(cleanedAnswer) || cleanedAnswer.includes(cleanedOption)) {
      const score = Math.min(cleanedOption.length, cleanedAnswer.length) / 
                   Math.max(cleanedOption.length, cleanedAnswer.length);
      
      console.log(`Partial match with option ${option}, score:`, score);
      
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = option;
      }
    }
  }
  
  if (bestMatch && bestMatchScore > 0.5) {
    console.log('Best matching option:', bestMatch.toUpperCase(), 'with score:', bestMatchScore);
    return bestMatch.toUpperCase();
  }
  
  // If no good match found, return the original answer
  console.log('No good match found, returning original answer');
  return answer;
};

// Helper function to check if user is admin
const isAdmin = (user) => {
  return user && user.role === 'admin';
};

// Helper function to check if user can access a specific route
const canAccessRoute = (user, allowedRoles) => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin can access everything
  return allowedRoles.includes(user.role);
};

// Get exam count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    // Count total exams
    const result = await pool.query('SELECT COUNT(*) FROM exams');
    const count = parseInt(result.rows[0].count) || 0;

    // Get additional stats if needed
    const activeExamsResult = await pool.query(
      "SELECT COUNT(*) FROM exams WHERE end_datetime > NOW()"
    );
    const activeExams = parseInt(activeExamsResult.rows[0].count) || 0;

    // Return the count and additional stats
    res.json({
      count,
      activeExams
    });
  } catch (error) {
    console.error('Error counting exams:', error);
    res.status(500).json({ message: 'Failed to count exams', count: 0 });
  }
});

// Get all exams
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('GET /api/exams request received');
    console.log('User:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'Not authenticated');
    console.log('Query params:', req.query);

    const { course_id, chapter_id } = req.query;

    let query = `
      SELECT e.*,
             c.name as course_name,
             u.name as created_by_name,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (course_id) {
      queryParams.push(course_id);
      query += ` AND e.course_id = $${queryParams.length}`;
    }

    if (chapter_id) {
      queryParams.push(chapter_id);
      query += ` AND EXISTS (
        SELECT 1 FROM exam_chapters ec
        WHERE ec.exam_id = e.id AND ec.chapter_id = $${queryParams.length}
      )`;
    }

    query += ` ORDER BY e.created_at DESC`;

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    const result = await pool.query(query, queryParams);
    console.log(`Found ${result.rows.length} exams`);

    if (result.rows.length === 0) {
      console.log('No exams found. Checking if exams table has any records...');
      const countResult = await pool.query('SELECT COUNT(*) FROM exams');
      console.log(`Total exams in database: ${countResult.rows[0].count}`);
    } else {
      console.log('First exam ID:', result.rows[0].id);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exam by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const examId = req.params.id;
    console.log(`GET /api/exams/${examId} request received`);
    console.log('User:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'Not authenticated');

    // Validate the exam ID is a number
    if (isNaN(examId)) {
      console.error(`Invalid exam ID format: ${examId}`);
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }

    // Get exam details
    console.log(`Fetching exam details for ID: ${examId}`);
    const examQuery = `
      SELECT e.*,
             c.name as course_name,
             u.name as created_by_name
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;

    const examResult = await pool.query(examQuery, [examId]);
    console.log(`Exam query result rows: ${examResult.rows.length}`);

    if (examResult.rows.length === 0) {
      console.log(`Exam with ID ${examId} not found`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];
    console.log(`Found exam: ${exam.title}`);

    // Get exam chapters
    console.log(`Fetching chapters for exam ID: ${examId}`);
    try {
      const chaptersQuery = `
        SELECT ch.*, ec.id as exam_chapter_id, s.name as subject_name, c.name as class_name
        FROM exam_chapters ec
        JOIN chapters ch ON ec.chapter_id = ch.id
        JOIN subjects s ON ch.subject_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE ec.exam_id = $1
      `;

      const chaptersResult = await pool.query(chaptersQuery, [examId]);
      console.log(`Found ${chaptersResult.rows.length} chapters for exam ID: ${examId}`);
      exam.chapters = chaptersResult.rows;
    } catch (chapterError) {
      console.error('Error fetching exam chapters:', chapterError);
      // Continue execution but with empty chapters array
      exam.chapters = [];
    }

    // Get exam questions with full details
    console.log(`Fetching questions for exam ID: ${examId}`);
    try {
      // First check if there are any questions in the exam_questions table
      const checkQuery = `SELECT COUNT(*) FROM exam_questions WHERE exam_id = $1`;
      const checkResult = await pool.query(checkQuery, [examId]);
      const questionCount = parseInt(checkResult.rows[0].count);
      console.log(`Exam ${examId} has ${questionCount} questions in exam_questions table`);
      
      if (questionCount === 0) {
        console.log('No questions found for this exam in the exam_questions table');
        exam.questions = [];
        return;
      }
      
      // Get a sample question to check the schema
      const sampleQuery = `
        SELECT * FROM questions q 
        JOIN exam_questions eq ON q.id = eq.question_id 
        WHERE eq.exam_id = $1 LIMIT 1
      `;
      
      try {
        const sampleResult = await pool.query(sampleQuery, [examId]);
        if (sampleResult.rows.length > 0) {
          console.log('Sample question columns:', Object.keys(sampleResult.rows[0]));
          console.log('Sample question chapter field:', sampleResult.rows[0].chapter);
        } else {
          console.log('No sample question found');
        }
      } catch (sampleError) {
        console.error('Error fetching sample question:', sampleError);
      }
      
      // Use a simpler query that doesn't rely on the chapter join which has type mismatch issues
      const questionsQuery = `
        SELECT q.id, q.ques, q.option_a, q.option_b, q.option_c, q.option_d, 
               q.answer,
               q.explanation, q.difficulty_level, q.reference, q.topic,
               q.chapter as chapter_name, q.subject as subject_name, q.classname as class_name,
               eq.marks, eq.question_order
        FROM exam_questions eq
        JOIN questions q ON eq.question_id = q.id
        WHERE eq.exam_id = $1
        ORDER BY eq.question_order
      `;
      
      console.log('Executing questions query:', questionsQuery);
      console.log('With exam ID:', examId);

      const questionsResult = await pool.query(questionsQuery, [examId]);
      console.log(`Found ${questionsResult.rows.length} questions for exam ID: ${examId}`);
      
      if (questionsResult.rows.length === 0) {
        console.log('No questions found in the join query. Trying a simpler query...');
        // Try a simpler query as a fallback
        const simpleQuery = `
          SELECT q.id, q.ques, q.option_a, q.option_b, q.option_c, q.option_d, 
                 q.answer,
                 q.explanation, q.difficulty_level, q.reference, q.topic,
                 q.chapter as chapter_name, q.subject as subject_name, q.classname as class_name,
                 eq.marks, eq.question_order
          FROM exam_questions eq
          JOIN questions q ON eq.question_id = q.id
          WHERE eq.exam_id = $1
          ORDER BY eq.question_order
        `;
        
        const simpleResult = await pool.query(simpleQuery, [examId]);
        console.log(`Simple query found ${simpleResult.rows.length} questions`);
        
        if (simpleResult.rows.length > 0) {
          exam.questions = simpleResult.rows;
          console.log('Using simplified question data without chapter/subject/class info');
        } else {
          exam.questions = [];
        }
      } else {
        exam.questions = questionsResult.rows;
        console.log('First question:', questionsResult.rows[0]);
      }
    } catch (questionError) {
      console.error('Error fetching exam questions:', questionError);
      // Continue execution but with empty questions array
      exam.questions = [];
    }

    console.log(`Successfully prepared exam data for ID: ${examId}`);
    res.json(exam);
  } catch (error) {
    console.error(`Error fetching exam ID ${req.params.id}:`, error);
    console.error('Error stack:', error.stack);
    
    if (error.code) {
      console.error('PostgreSQL error code:', error.code);
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Create new exam - Admin only
router.post('/', authMiddleware, async (req, res) => {
  console.log('Create exam request received');
  console.log('User:', req.user);
  console.log('Request body:', req.body);
  // Check if user is admin
  console.log('Checking if user is admin:', req.user);
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!isAdmin(req.user)) {
    console.log('User is not admin, role:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Only administrators can create exams.' });
  }

  console.log('Admin check passed, proceeding with exam creation');

  const client = await pool.connect();

  try {
    // Get exam data from request body
    let examData = { ...req.body };
    console.log('Exam data received:', examData);

    // Sanitize integer fields - convert empty strings to null and string numbers to integers
    const integerFields = ['course_id', 'negative_percentage', 'duration_minutes', 'total_marks', 'passing_score', 'max_attempts'];
    integerFields.forEach(field => {
      if (examData[field] === '') {
        examData[field] = null;
      } else if (typeof examData[field] === 'string' && !isNaN(examData[field])) {
        // Convert string numbers to integers
        examData[field] = parseInt(examData[field]);
        console.log(`Converted ${field} from string to integer:`, examData[field]);
      }
    });

    // Ensure arrays are properly formatted
    console.log('Processing chapters data, original format:', typeof examData.chapters, examData.chapters);
    if (typeof examData.chapters === 'string') {
      try {
        examData.chapters = JSON.parse(examData.chapters);
        console.log('Chapters parsed from JSON string:', examData.chapters);
      } catch (e) {
        console.log('Failed to parse chapters as JSON, trying comma-separated format');
        examData.chapters = examData.chapters.split(',').map(id => parseInt(id.trim()));
        console.log('Chapters parsed from comma-separated string:', examData.chapters);
      }
    }

    // Ensure all chapter IDs are integers
    if (Array.isArray(examData.chapters)) {
      examData.chapters = examData.chapters.map(id => typeof id === 'string' ? parseInt(id) : id);
      console.log('Final chapters array after conversion:', examData.chapters);
    } else {
      console.log('Warning: chapters is not an array after processing:', examData.chapters);
      examData.chapters = [];
    }

    if (typeof examData.questions === 'string') {
      try {
        examData.questions = JSON.parse(examData.questions);
      } catch (e) {
        console.error('Error parsing questions:', e);
        examData.questions = [];
      }
    }

    if (typeof examData.identifier_list === 'string') {
      try {
        examData.identifier_list = JSON.parse(examData.identifier_list);
      } catch (e) {
        examData.identifier_list = examData.identifier_list.split(',').map(id => id.trim());
      }
    }

    if (typeof examData.email_list === 'string') {
      try {
        examData.email_list = JSON.parse(examData.email_list);
      } catch (e) {
        examData.email_list = examData.email_list.split(',').map(id => id.trim());
      }
    }

    const {
      // Basic exam info
      title, description, start_datetime, end_datetime,
      syllabus, duration_minutes, total_marks, course_id,
      chapters, questions,

      // Basic Settings
      introduction,

      // Question Settings
      pagination_type, allow_blank_answers,
      negative_marking, negative_percentage, shuffle_questions,
      can_change_answer,

      // Review Settings
      conclusion_text, show_custom_result_message,
      pass_message, fail_message, passing_score,
      show_score, show_test_outline, show_correct_incorrect,
      show_correct_answer, show_explanation,

      // Access Control
      access_type, access_passcode, identifier_list, email_list,
      time_limit_type, attempt_limit_type, max_attempts,
      identifier_prompt,

      // Browser Settings
      disable_right_click, disable_copy_paste, disable_translate,
      disable_autocomplete, disable_spellcheck, disable_printing
    } = examData;

    await client.query('BEGIN');

    console.log('Preparing to insert exam into database');
    console.log('Title:', title);
    console.log('Course ID:', course_id);
    console.log('Chapters:', chapters);
    console.log('Questions:', questions);

    // Use a simpler approach - just use the basic schema that we know exists
    console.log('Using basic schema for exam creation to avoid column issues');

    // Create exam with basic settings only (original schema)
    const examQuery = `
      INSERT INTO exams (
        title, description, start_datetime, end_datetime,
        negative_marking, negative_percentage, shuffle_questions,
        can_change_answer, syllabus, duration_minutes, total_marks,
        course_id, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `;

    // Create the values array with only the basic fields
    const examValues = [
      title, description, start_datetime, end_datetime,
      negative_marking, negative_percentage, shuffle_questions,
      can_change_answer, syllabus, duration_minutes, total_marks,
      course_id, req.user.id
    ];

    // Exam insertion is now handled below

    // Define examId variable outside the try block
    let examId;

    try {
      // Log each value with its type for debugging
      console.log('Executing exam insert query with values:');
      examValues.forEach((value, index) => {
        console.log(`Parameter $${index + 1}:`, value, typeof value);
      });

      // Validate values before insertion
      const validatedValues = examValues.map((value, index) => {
        // Handle specific parameters that need type conversion
        if (index === 11) { // course_id (index 11)
          return typeof value === 'string' ? parseInt(value) : value;
        }
        // Handle array parameters
        if (index === 28 || index === 29) { // identifier_list, email_list
          return Array.isArray(value) ? value : [];
        }
        return value;
      });

      const examResult = await client.query(examQuery, validatedValues);
      console.log('Exam inserted successfully');
      examId = examResult.rows[0].id;
      console.log('New exam ID:', examId);
    } catch (insertError) {
      console.error('Error inserting exam:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error detail:', insertError.detail);
      throw insertError; // Re-throw to be caught by the outer catch block
    }

    // Add chapters to exam
    if (chapters && chapters.length > 0) {
      console.log('Adding chapters to exam:', chapters);
      console.log('Chapter types:', chapters.map(id => typeof id));

      for (const chapterId of chapters) {
        try {
          // Ensure chapter ID is an integer
          const chapterIdInt = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
          console.log(`Processing chapter ID: ${chapterId} (${typeof chapterId}) -> ${chapterIdInt} (${typeof chapterIdInt})`);

          // Verify chapter exists before adding
          const chapterCheck = await client.query('SELECT id FROM chapters WHERE id = $1', [chapterIdInt]);
          if (chapterCheck.rows.length === 0) {
            console.warn(`Warning: Chapter ID ${chapterIdInt} does not exist in the database`);
            continue; // Skip this chapter but continue with others
          }

          await client.query(
            'INSERT INTO exam_chapters (exam_id, chapter_id) VALUES ($1, $2)',
            [examId, chapterIdInt]
          );
          console.log('Added chapter', chapterIdInt, 'to exam', examId);
        } catch (chapterError) {
          console.error('Error adding chapter', chapterId, 'to exam:', chapterError);
          console.error('Error details:', chapterError.message);
          // Continue instead of throwing to allow other chapters to be added
          console.log('Continuing with other chapters...');
        }
      }
    } else {
      console.log('No chapters to add to exam');
    }

    // Add questions to exam
    if (questions && questions.length > 0) {
      console.log('Adding questions to exam:', questions);
      const questionValues = questions.map((q, index) => {
        return [
          examId,
          q.id,
          q.marks || 1,
          index + 1
        ];
      });

      for (const qValues of questionValues) {
        try {
          // Ensure all values are of the correct type
          const processedValues = [
            examId,
            typeof qValues[1] === 'string' ? parseInt(qValues[1]) : qValues[1], // question_id
            typeof qValues[2] === 'string' ? parseInt(qValues[2]) : qValues[2], // marks
            typeof qValues[3] === 'string' ? parseInt(qValues[3]) : qValues[3]  // question_order
          ];

          // Verify question exists before adding
          const questionCheck = await client.query('SELECT id FROM questions WHERE id = $1', [processedValues[1]]);
          if (questionCheck.rows.length === 0) {
            console.warn(`Warning: Question ID ${processedValues[1]} does not exist in the database`);
            continue; // Skip this question but continue with others
          }

          await client.query(
            'INSERT INTO exam_questions (exam_id, question_id, marks, question_order) VALUES ($1, $2, $3, $4)',
            processedValues
          );
          console.log('Added question', processedValues[1], 'to exam', examId, 'with marks', processedValues[2]);
        } catch (questionError) {
          console.error('Error adding question to exam:', questionError);
          console.error('Error details:', questionError.message);
          // Continue instead of throwing to allow other questions to be added
          console.log('Continuing with other questions...');
        }
      }
    } else {
      console.log('No questions to add to exam');
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    // Fetch the created exam to return
    try {
      console.log('Fetching newly created exam with ID:', examId);
      const fetchQuery = 'SELECT * FROM exams WHERE id = $1';
      const fetchResult = await pool.query(fetchQuery, [examId]);

      if (fetchResult.rows.length === 0) {
        console.error('Could not fetch the created exam');
        res.status(500).json({ message: 'Exam was created but could not be retrieved' });
        return;
      }

      // Return created exam with questions
      const newExam = fetchResult.rows[0];
      newExam.questions = questions;
      newExam.chapters = chapters;

      console.log('Successfully created exam:', newExam.id);
      console.log('Exam details:', JSON.stringify(newExam, null, 2));

      // Verify the exam is actually in the database with a separate connection
      const verifyResult = await pool.query('SELECT COUNT(*) FROM exams WHERE id = $1', [examId]);
      console.log(`Verification query shows ${verifyResult.rows[0].count} exams with ID ${examId}`);

      res.status(201).json(newExam);
    } catch (fetchError) {
      console.error('Error fetching created exam:', fetchError);
      res.status(201).json({
        message: 'Exam was created successfully but details could not be retrieved',
        id: examId
      });
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
      console.error('Error creating exam:', error);

      // Provide more detailed error information
      let errorMessage = 'Server error';
      let errorDetails = error.message;

      // Check for specific error types
      if (error.code === '23505') {
        errorMessage = 'Duplicate entry error';
        errorDetails = 'An exam with similar details already exists';
      } else if (error.code === '23503') {
        errorMessage = 'Foreign key constraint error';
        errorDetails = 'One of the referenced items (course, chapter, question) does not exist';
      } else if (error.code === '22P02') {
        errorMessage = 'Invalid data type';
        errorDetails = 'One of the values has an incorrect data type';
      }

      console.error('Detailed error information:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      res.status(500).json({
        message: errorMessage,
        error: errorDetails,
        code: error.code || 'unknown'
      });
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
      res.status(500).json({
        message: 'Critical database error',
        error: 'Error occurred and rollback failed'
      });
    }
  } finally {
    try {
      client.release();
    } catch (releaseError) {
      console.error('Error releasing client:', releaseError);
    }
  }
});

// Update exam - Admin only
router.put('/:id', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: 'Access denied. Only administrators can update exams.' });
  }

  const client = await pool.connect();

  try {
    const examId = req.params.id;

    // Get exam data from request body and sanitize
    let examData = { ...req.body };

    // Sanitize integer fields - convert empty strings to null
    const integerFields = ['course_id', 'negative_percentage', 'duration_minutes', 'total_marks', 'passing_score', 'max_attempts'];
    integerFields.forEach(field => {
      if (examData[field] === '') {
        examData[field] = null;
      }
    });

    const {
      // Basic exam info
      title, description, start_datetime, end_datetime,
      syllabus, duration_minutes, total_marks, course_id,
      chapters, questions,

      // Basic Settings
      introduction,

      // Question Settings
      pagination_type, allow_blank_answers,
      negative_marking, negative_percentage, shuffle_questions,
      can_change_answer,

      // Review Settings
      conclusion_text, show_custom_result_message,
      pass_message, fail_message, passing_score,
      show_score, show_test_outline, show_correct_incorrect,
      show_correct_answer, show_explanation,

      // Access Control
      access_type, access_passcode, identifier_list, email_list,
      time_limit_type, attempt_limit_type, max_attempts,
      identifier_prompt,

      // Browser Settings
      disable_right_click, disable_copy_paste, disable_translate,
      disable_autocomplete, disable_spellcheck, disable_printing
    } = examData;

    await client.query('BEGIN');

    // Update exam with all settings
    const examQuery = `
      UPDATE exams SET
        title = $1,
        description = $2,
        start_datetime = $3,
        end_datetime = $4,
        negative_marking = $5,
        negative_percentage = $6,
        shuffle_questions = $7,
        can_change_answer = $8,
        syllabus = $9,
        duration_minutes = $10,
        total_marks = $11,
        course_id = $12,

        introduction = $14,

        pagination_type = $15,
        allow_blank_answers = $16,

        conclusion_text = $17,
        show_custom_result_message = $18,
        pass_message = $19,
        fail_message = $20,
        passing_score = $21,
        show_score = $22,
        show_test_outline = $23,
        show_correct_incorrect = $24,
        show_correct_answer = $25,
        show_explanation = $26,

        access_type = $27,
        access_passcode = $28,
        identifier_list = $29,
        email_list = $30,
        time_limit_type = $31,
        attempt_limit_type = $32,
        max_attempts = $33,
        identifier_prompt = $34,

        disable_right_click = $35,
        disable_copy_paste = $36,
        disable_translate = $37,
        disable_autocomplete = $38,
        disable_spellcheck = $39,
        disable_printing = $40,

        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const examValues = [
      title, description, start_datetime, end_datetime,
      negative_marking, negative_percentage, shuffle_questions,
      can_change_answer, syllabus, duration_minutes, total_marks,
      course_id, examId,

      introduction,

      pagination_type, allow_blank_answers,

      conclusion_text, show_custom_result_message,
      pass_message, fail_message, passing_score,
      show_score, show_test_outline, show_correct_incorrect,
      show_correct_answer, show_explanation,

      access_type, access_passcode, identifier_list, email_list,
      time_limit_type, attempt_limit_type, max_attempts,
      identifier_prompt,

      disable_right_click, disable_copy_paste, disable_translate,
      disable_autocomplete, disable_spellcheck, disable_printing
    ];

    const examResult = await client.query(examQuery, examValues);

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Update exam chapters - first remove existing ones
    await client.query('DELETE FROM exam_chapters WHERE exam_id = $1', [examId]);
    console.log('Deleted existing chapters for exam ID:', examId);

    // Then add new chapters
    if (chapters && chapters.length > 0) {
      console.log('Adding updated chapters to exam:', chapters);
      console.log('Chapter types:', chapters.map(id => typeof id));

      for (const chapterId of chapters) {
        try {
          // Ensure chapter ID is an integer
          const chapterIdInt = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
          console.log(`Processing chapter ID: ${chapterId} (${typeof chapterId}) -> ${chapterIdInt} (${typeof chapterIdInt})`);

          // Verify chapter exists before adding
          const chapterCheck = await client.query('SELECT id FROM chapters WHERE id = $1', [chapterIdInt]);
          if (chapterCheck.rows.length === 0) {
            console.warn(`Warning: Chapter ID ${chapterIdInt} does not exist in the database`);
            continue; // Skip this chapter but continue with others
          }

          await client.query(
            'INSERT INTO exam_chapters (exam_id, chapter_id) VALUES ($1, $2)',
            [examId, chapterIdInt]
          );
          console.log('Added chapter', chapterIdInt, 'to exam', examId);
        } catch (chapterError) {
          console.error('Error adding chapter', chapterId, 'to exam:', chapterError);
          console.error('Error details:', chapterError.message);
          // Continue instead of throwing to allow other chapters to be added
          console.log('Continuing with other chapters...');
        }
      }
    } else {
      console.log('No chapters to add to exam');
    }

    // Update exam questions - first remove existing ones
    await client.query('DELETE FROM exam_questions WHERE exam_id = $1', [examId]);

    // Then add new questions
    if (questions && questions.length > 0) {
      const questionValues = questions.map((q, index) => {
        return [
          examId,
          q.id,
          q.marks || 1,
          index + 1
        ];
      });

      for (const qValues of questionValues) {
        await client.query(
          'INSERT INTO exam_questions (exam_id, question_id, marks, question_order) VALUES ($1, $2, $3, $4)',
          qValues
        );
      }
    }

    await client.query('COMMIT');

    // Return updated exam with questions
    const updatedExam = examResult.rows[0];
    updatedExam.questions = questions;
    updatedExam.chapters = chapters;

    res.json(updatedExam);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

// Delete exam - Admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: 'Access denied. Only administrators can delete exams.' });
  }

  try {
    const examId = req.params.id;

    // Check if exam exists
    const checkResult = await pool.query('SELECT id FROM exams WHERE id = $1', [examId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Delete exam (cascade will handle exam_questions)
    await pool.query('DELETE FROM exams WHERE id = $1', [examId]);

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Recalculate exam scores after answer changes - Admin only
router.post('/:id/recalculate', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: 'Access denied. Only administrators can recalculate exam scores.' });
  }

  const client = await pool.connect();

  try {
    const examId = req.params.id;

    await client.query('BEGIN');

    // Get all attempts for this exam
    const attemptsResult = await client.query(
      'SELECT id FROM exam_attempts WHERE exam_id = $1',
      [examId]
    );

    const attempts = attemptsResult.rows;

    for (const attempt of attempts) {
      // Get all responses for this attempt
      const responsesResult = await client.query(
        `SELECT er.id, er.question_id, er.selected_option,
                q.answer, eq.marks
         FROM exam_responses er
         JOIN questions q ON er.question_id = q.id
         JOIN exam_questions eq ON er.question_id = eq.question_id AND eq.exam_id = $1
         WHERE er.exam_attempt_id = $2`,
        [examId, attempt.id]
      );

      const responses = responsesResult.rows;
      let totalScore = 0;

      // Get exam details for negative marking
      const examResult = await client.query(
        'SELECT negative_marking, negative_percentage FROM exams WHERE id = $1',
        [examId]
      );

      const exam = examResult.rows[0];

      for (const response of responses) {
        const isCorrect = response.selected_option === response.answer;
        let marksObtained = 0;

        if (isCorrect) {
          marksObtained = response.marks;
        } else if (response.selected_option && exam.negative_marking) {
          // Apply negative marking if answer is wrong and negative marking is enabled
          marksObtained = -(response.marks * (exam.negative_percentage / 100));
        }

        // Update response
        await client.query(
          'UPDATE exam_responses SET is_correct = $1, marks_obtained = $2, updated_at = NOW() WHERE id = $3',
          [isCorrect, marksObtained, response.id]
        );

        totalScore += marksObtained;
      }

      // Update attempt score
      await client.query(
        'UPDATE exam_attempts SET score = $1 WHERE id = $2',
        [totalScore, attempt.id]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Exam scores recalculated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recalculating exam scores:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

// Get exam attempt for a specific user
router.get('/:id/attempt', authMiddleware, async (req, res) => {
  try {
    const examId = req.params.id;
    const userId = req.user.id;

    // Check if user has attempted this exam
    const attemptQuery = `
      SELECT * FROM exam_attempts
      WHERE exam_id = $1 AND user_id = $2
    `;

    const attemptResult = await pool.query(attemptQuery, [examId, userId]);

    if (attemptResult.rows.length === 0) {
      // No attempt found
      return res.json(null);
    }

    const attempt = attemptResult.rows[0];

    // Get responses for this attempt
    const responsesQuery = `
      SELECT er.*, q.ques, q.option_a, q.option_b, q.option_c, q.option_d
      FROM exam_responses er
      JOIN questions q ON er.question_id = q.id
      WHERE er.exam_attempt_id = $1
    `;

    const responsesResult = await pool.query(responsesQuery, [attempt.id]);

    attempt.responses = responsesResult.rows;

    res.json(attempt);
  } catch (error) {
    console.error('Error fetching exam attempt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start exam attempt - Available to both students and admins
router.post('/:id/start', authMiddleware, async (req, res) => {
  console.log('Starting exam attempt for exam ID:', req.params.id, 'User:', req.user.id);
  const client = await pool.connect();

  try {
    const examId = req.params.id;
    const userId = req.user.id;
    const { identifier, passcode } = req.body;

    await client.query('BEGIN');

    // Get exam details including access control settings
    const examQuery = `
      SELECT * FROM exams
      WHERE id = $1
    `;

    const examResult = await client.query(examQuery, [examId]);

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    // Check if the exam is within the active time period
    const now = new Date();
    const startTime = new Date(exam.start_datetime);
    const endTime = new Date(exam.end_datetime);
    const isActive = now >= startTime && now <= endTime;

    if (!isActive && !isAdmin(req.user)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Exam is not available at this time'
      });
    }

    // Check access control restrictions
    if (!isAdmin(req.user)) {
      // Skip access checks for admins

      // Check access control type
      switch (exam.access_type) {
        case 'passcode':
          if (!passcode || passcode !== exam.access_passcode) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Invalid passcode' });
          }
          break;

        case 'identifier_list':
          if (!identifier || !exam.identifier_list.includes(identifier)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Invalid identifier' });
          }
          break;

        case 'email_list':
          if (!identifier || !exam.email_list.includes(identifier)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Invalid email address' });
          }
          break;

        case 'anyone':
          // No restrictions
          break;

        default:
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Invalid access type' });
      }
    }

    // Check attempt limits
    if (!isAdmin(req.user) && exam.attempt_limit_type === 'limited') {
      // Count previous completed attempts
      const attemptCountQuery = `
        SELECT COUNT(*) FROM exam_attempts
        WHERE exam_id = $1 AND user_id = $2 AND completed = true
      `;

      const attemptCountResult = await client.query(attemptCountQuery, [examId, userId]);
      const attemptCount = parseInt(attemptCountResult.rows[0].count);

      if (attemptCount >= exam.max_attempts) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: `Maximum attempt limit (${exam.max_attempts}) reached for this exam`
        });
      }
    }

    // Check if user already has an uncompleted attempt
    const checkAttemptQuery = `
      SELECT * FROM exam_attempts
      WHERE exam_id = $1 AND user_id = $2 AND completed = false
    `;

    const checkResult = await client.query(checkAttemptQuery, [examId, userId]);

    if (checkResult.rows.length > 0) {
      // Return existing uncompleted attempt
      await client.query('COMMIT');
      return res.json(checkResult.rows[0]);
    }

    // Create new attempt
    const createAttemptQuery = `
      INSERT INTO exam_attempts (exam_id, user_id, total_questions)
      VALUES ($1, $2, (SELECT COUNT(*) FROM exam_questions WHERE exam_id = $1))
      RETURNING *
    `;

    const attemptResult = await client.query(createAttemptQuery, [examId, userId]);
    const attemptId = attemptResult.rows[0].id;

    // Get questions for this exam
    console.log('Getting questions for exam ID:', examId);
    const questionsQuery = `
      SELECT q.id, eq.question_order, eq.marks
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY ${exam.shuffle_questions ? 'RANDOM()' : 'eq.question_order'}
    `;

    const questionsResult = await client.query(questionsQuery, [examId]);
    const questions = questionsResult.rows;

    // Create empty responses for each question
    console.log('Creating empty responses for', questions.length, 'questions');
    for (const question of questions) {
      console.log('Creating response for question ID:', question.id);
      await client.query(
        'INSERT INTO exam_responses (exam_attempt_id, question_id) VALUES ($1, $2)',
        [attemptId, question.id]
      );
    }

    await client.query('COMMIT');

    // Return the attempt with user identity
    const attempt = attemptResult.rows[0];
    attempt.identifier = identifier;

    res.json(attempt);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error starting exam attempt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

// Submit response - Available to both students and admins
router.post('/response', authMiddleware, async (req, res) => {
  try {
    const { exam_attempt_id, question_id, selected_option } = req.body;

    // Verify that this attempt belongs to the current user
    const verifyQuery = `
      SELECT ea.*, e.can_change_answer
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.id = $1 AND ea.user_id = $2
    `;

    const verifyResult = await pool.query(verifyQuery, [exam_attempt_id, req.user.id]);

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const attempt = verifyResult.rows[0];

    if (attempt.completed) {
      return res.status(400).json({ message: 'Exam has already been submitted' });
    }

    // Check if answer can be changed
    if (!attempt.can_change_answer) {
      const checkResponse = await pool.query(
        'SELECT * FROM exam_responses WHERE exam_attempt_id = $1 AND question_id = $2 AND selected_option IS NOT NULL',
        [exam_attempt_id, question_id]
      );

      if (checkResponse.rows.length > 0) {
        return res.status(400).json({ message: 'Answers cannot be changed for this exam' });
      }
    }

    // Update response
    const responseQuery = `
      UPDATE exam_responses
      SET selected_option = $1, updated_at = NOW()
      WHERE exam_attempt_id = $2 AND question_id = $3
      RETURNING *
    `;

    const responseResult = await pool.query(responseQuery, [selected_option, exam_attempt_id, question_id]);

    res.json(responseResult.rows[0]);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit response for specific exam - Available to both students and admins
router.post('/:id/response', authMiddleware, async (req, res) => {
  console.log('Submitting response for exam ID:', req.params.id, 'User:', req.user.id, 'Data:', req.body);
  try {
    const { attempt_id, question_id, selected_option } = req.body;
    const examId = req.params.id;

    if (!attempt_id || !question_id || !selected_option) {
      return res.status(400).json({ message: 'Missing required fields: attempt_id, question_id, or selected_option' });
    }

    // Verify that this attempt belongs to the current user and to the specified exam
    const verifyQuery = `
      SELECT ea.*, e.can_change_answer
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.id = $1 AND ea.user_id = $2 AND ea.exam_id = $3
    `;

    const verifyResult = await pool.query(verifyQuery, [attempt_id, req.user.id, examId]);
    console.log('Verify result:', verifyResult.rows);

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const attempt = verifyResult.rows[0];

    if (attempt.completed) {
      return res.status(400).json({ message: 'Exam has already been submitted' });
    }

    // Check if answer can be changed
    if (!attempt.can_change_answer) {
      const checkResponse = await pool.query(
        'SELECT * FROM exam_responses WHERE exam_attempt_id = $1 AND question_id = $2 AND selected_option IS NOT NULL',
        [attempt_id, question_id]
      );

      if (checkResponse.rows.length > 0) {
        return res.status(400).json({ message: 'Answers cannot be changed for this exam' });
      }
    }

    // Check if response exists
    const checkExistsQuery = `
      SELECT * FROM exam_responses
      WHERE exam_attempt_id = $1 AND question_id = $2
    `;

    const existsResult = await pool.query(checkExistsQuery, [attempt_id, question_id]);
    console.log('Exists check result:', existsResult.rows);

    let responseResult;

    if (existsResult.rows.length > 0) {
      // Update existing response
      console.log('Updating existing response');
      const responseQuery = `
        UPDATE exam_responses
        SET selected_option = $1, updated_at = NOW()
        WHERE exam_attempt_id = $2 AND question_id = $3
        RETURNING *
      `;

      responseResult = await pool.query(responseQuery, [selected_option, attempt_id, question_id]);
    } else {
      // Create new response
      console.log('Creating new response');
      const responseQuery = `
        INSERT INTO exam_responses (exam_attempt_id, question_id, selected_option)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      responseResult = await pool.query(responseQuery, [attempt_id, question_id, selected_option]);
    }

    console.log('Response saved:', responseResult.rows[0]);
    res.json(responseResult.rows[0]);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit exam - Available to both students and admins
router.post('/:id/submit', authMiddleware, async (req, res) => {
  console.log('Submitting exam ID:', req.params.id, 'User:', req.user.id, 'Data:', req.body);
  const client = await pool.connect();

  try {
    const examId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get exam details
    const examQuery = `
      SELECT * FROM exams
      WHERE id = $1
    `;

    const examResult = await client.query(examQuery, [examId]);

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    // Get attempt
    const attemptQuery = `
      SELECT ea.*
      FROM exam_attempts ea
      WHERE ea.exam_id = $1 AND ea.user_id = $2 AND ea.completed = false
    `;

    const attemptResult = await client.query(attemptQuery, [examId, userId]);

    if (attemptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'No active exam attempt found' });
    }

    const attempt = attemptResult.rows[0];

    // Check if blank answers are allowed
    if (!exam.allow_blank_answers) {
      // Count responses with no selected answer
      const blankAnswersQuery = `
        SELECT COUNT(*) FROM exam_responses
        WHERE exam_attempt_id = $1 AND selected_option IS NULL
      `;

      const blankResult = await client.query(blankAnswersQuery, [attempt.id]);
      const blankCount = parseInt(blankResult.rows[0].count);

      if (blankCount > 0) {
        // Since the frontend should already have a confirmation, we'll just warn the user
        console.log(`Warning: Attempt ${attempt.id} was submitted with ${blankCount} unanswered questions`);
      }
    }

    // Calculate score
    console.log('Calculating score for attempt:', attempt.id);
    const responsesQuery = `
      SELECT er.id, er.question_id, er.selected_option,
             q.answer as correct_option, eq.marks,
             q.option_a, q.option_b, q.option_c, q.option_d
      FROM exam_responses er
      JOIN questions q ON er.question_id = q.id
      JOIN exam_questions eq ON er.question_id = eq.question_id AND eq.exam_id = $1
      WHERE er.exam_attempt_id = $2
    `;

    const responsesResult = await client.query(responsesQuery, [examId, attempt.id]);
    const responses = responsesResult.rows;
    console.log('Found', responses.length, 'responses to score');

    let totalScore = 0;
    let totalMarks = 0;

    for (const response of responses) {
      // Use smart answer matching to determine the correct option
      const options = {
        'A': response.option_a,
        'B': response.option_b,
        'C': response.option_c,
        'D': response.option_d
      };
      
      const smartCorrectOption = findBestMatchingOption(response.correct_option, options);
      console.log('Question ID:', response.question_id, 'Original correct_option:', response.correct_option, 'Smart correct_option:', smartCorrectOption);
      
      const isCorrect = response.selected_option === smartCorrectOption;
      let marksObtained = 0;
      totalMarks += response.marks;

      console.log(
        'Question ID:', response.question_id,
        'Selected:', response.selected_option,
        'Correct:', response.correct_option,
        'Is Correct:', isCorrect,
        'Marks:', response.marks
      );

      if (isCorrect) {
        // Correct answer gets full marks
        marksObtained = response.marks;
      } else if (response.selected_option && exam.negative_marking) {
        // Apply negative marking if answer is wrong and negative marking is enabled
        // Use the negative_percentage from exam settings
        marksObtained = -(response.marks * (exam.negative_percentage / 100));
        console.log('Applied negative marking:', marksObtained);
      } else if (!response.selected_option && !exam.allow_blank_answers) {
        // If blank answers are not allowed, treat them as wrong answers
        // with negative marking if enabled
        if (exam.negative_marking) {
          marksObtained = -(response.marks * (exam.negative_percentage / 100));
          console.log('Applied negative marking for blank answer:', marksObtained);
        }
      }

      // Update response
      await client.query(
        'UPDATE exam_responses SET is_correct = $1, marks_obtained = $2 WHERE id = $3',
        [isCorrect, marksObtained, response.id]
      );

      totalScore += marksObtained;
    }

    console.log('Total score:', totalScore, 'out of', totalMarks);

    // Cap minimum score at 0 if goes negative due to negative marking
    if (totalScore < 0) totalScore = 0;

    // Update attempt
    const updateQuery = `
      UPDATE exam_attempts
      SET completed = true, end_time = NOW(), score = $1
      WHERE id = $2
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [totalScore, attempt.id]);
    const completedAttempt = updateResult.rows[0];

    // Get updated responses with question details for the result
    let detailedResponses = [];

    if (exam.show_correct_incorrect || exam.show_correct_answer || exam.show_explanation) {
      const detailedResponsesQuery = `
        SELECT er.*, q.ques, q.option_a, q.option_b, q.option_c, q.option_d,
               ${exam.show_correct_answer ? 'q.answer,' : ''}
               ${exam.show_explanation ? 'q.explanation,' : ''}
               eq.marks
        FROM exam_responses er
        JOIN questions q ON er.question_id = q.id
        JOIN exam_questions eq ON er.question_id = eq.question_id AND eq.exam_id = $1
        WHERE er.exam_attempt_id = $2
        ORDER BY eq.question_order
      `;

      const detailedResult = await client.query(detailedResponsesQuery, [examId, attempt.id]);
      detailedResponses = detailedResult.rows;
    }

    await client.query('COMMIT');

    // Prepare result object
    const result = {
      ...completedAttempt,
      total_marks: exam.total_marks,
      passing_score: exam.passing_score,
      show_score: exam.show_score,
      show_test_outline: exam.show_test_outline,
      show_correct_incorrect: exam.show_correct_incorrect,
      show_correct_answer: exam.show_correct_answer,
      show_explanation: exam.show_explanation,
      show_custom_result_message: exam.show_custom_result_message,
      pass_message: exam.pass_message,
      fail_message: exam.fail_message,
      conclusion_text: exam.conclusion_text
    };

    // Only include detailed responses if settings allow
    if (exam.show_test_outline) {
      result.responses = detailedResponses;
    }

    res.json(result);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

// Verify access to an exam
router.post('/:id/verify-access', authMiddleware, async (req, res) => {
  try {
    const examId = req.params.id;
    const { passcode, identifier } = req.body;

    // Get exam details with all settings
    const examQuery = 'SELECT * FROM exams WHERE id = $1';
    const examResult = await pool.query(examQuery, [examId]);

    if (examResult.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    // Check if exam is active
    const now = new Date();
    if (now < new Date(exam.start_datetime) || now > new Date(exam.end_datetime)) {
      return res.status(403).json({
        access_granted: false,
        message: 'This exam is not currently active'
      });
    }

    // Check access based on access_type
    let accessGranted = false;
    let message = '';

    switch (exam.access_type) {
      case 'passcode':
        // Validate passcode
        if (!passcode) {
          return res.status(400).json({
            access_granted: false,
            message: 'Passcode is required'
          });
        }

        if (passcode === exam.access_passcode) {
          accessGranted = true;
        } else {
          message = 'Invalid passcode';
        }
        break;

      case 'identifier_list':
        // Validate identifier
        if (!identifier) {
          return res.status(400).json({
            access_granted: false,
            message: 'Identifier is required'
          });
        }

        // Check if identifier is in the allowed list
        if (exam.identifier_list && exam.identifier_list.includes(identifier)) {
          accessGranted = true;
        } else {
          message = 'Your identifier is not on the allowed list';
        }
        break;

      case 'email_list':
        // Validate email
        if (!identifier) {
          return res.status(400).json({
            access_granted: false,
            message: 'Email is required'
          });
        }

        // Check if email is in the allowed list
        if (exam.email_list && exam.email_list.includes(identifier)) {
          accessGranted = true;
        } else {
          message = 'Your email is not on the allowed list';
        }
        break;

      default: // 'anyone'
        accessGranted = true;
    }

    // Check attempt limits if access is granted
    if (accessGranted && exam.attempt_limit_type === 'limited') {
      // Count previous attempts
      const attemptsQuery = `
        SELECT COUNT(*) FROM exam_attempts
        WHERE exam_id = $1 AND user_id = $2
      `;
      const attemptsResult = await pool.query(attemptsQuery, [examId, req.user.id]);
      const attemptCount = parseInt(attemptsResult.rows[0].count);

      if (attemptCount >= exam.max_attempts) {
        accessGranted = false;
        message = `You have reached the maximum number of attempts (${exam.max_attempts}) for this exam`;
      }
    }

    res.json({
      access_granted: accessGranted,
      message: accessGranted ? 'Access granted' : message,
      // Include relevant settings for the frontend
      settings: accessGranted ? {
        time_limit_type: exam.time_limit_type,
        duration_minutes: exam.duration_minutes,
        pagination_type: exam.pagination_type,
        can_change_answer: exam.can_change_answer,
        allow_blank_answers: exam.allow_blank_answers,
        disable_right_click: exam.disable_right_click,
        disable_copy_paste: exam.disable_copy_paste,
        disable_translate: exam.disable_translate,
        disable_autocomplete: exam.disable_autocomplete,
        disable_spellcheck: exam.disable_spellcheck,
        disable_printing: exam.disable_printing
      } : null
    });
  } catch (error) {
    console.error('Error verifying access:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Note: There was a duplicate '/count' route here that was removed.
// The primary implementation is at the top of this file.

// Get exam leaderboard - Available to all users
router.get('/:id/leaderboard', authMiddleware, async (req, res) => {
  try {
    const examId = req.params.id;

    const query = `
      SELECT ea.id, ea.user_id, ea.score, ea.end_time,
             ea.start_time, u.name as user_name,
             EXTRACT(EPOCH FROM (ea.end_time - ea.start_time)) as completion_time_seconds
      FROM exam_attempts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.exam_id = $1 AND ea.completed = true
      ORDER BY ea.score DESC, completion_time_seconds ASC
    `;

    const result = await pool.query(query, [examId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;