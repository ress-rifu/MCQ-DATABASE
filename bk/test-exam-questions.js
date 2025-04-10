// Test script to check exam questions in the database
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/question_db'
});

// Function to test exam questions
async function testExamQuestions(examId) {
  console.log(`Testing exam questions for exam ID: ${examId}`);
  
  try {
    // 1. Check if the exam exists
    const examQuery = 'SELECT * FROM exams WHERE id = $1';
    const examResult = await pool.query(examQuery, [examId]);
    
    if (examResult.rows.length === 0) {
      console.log(`No exam found with ID: ${examId}`);
      return;
    }
    
    console.log(`Found exam: ${examResult.rows[0].title}`);
    
    // 2. Check for questions in exam_questions table
    const examQuestionsQuery = 'SELECT * FROM exam_questions WHERE exam_id = $1';
    const examQuestionsResult = await pool.query(examQuestionsQuery, [examId]);
    
    console.log(`Found ${examQuestionsResult.rows.length} entries in exam_questions table`);
    
    if (examQuestionsResult.rows.length === 0) {
      console.log('No questions associated with this exam');
      return;
    }
    
    // 3. Print the first few exam_questions entries
    console.log('Sample exam_questions entries:');
    examQuestionsResult.rows.slice(0, 3).forEach(row => {
      console.log(row);
    });
    
    // 4. Check if the questions exist in the questions table
    const questionIds = examQuestionsResult.rows.map(row => row.question_id);
    const questionsSample = questionIds.slice(0, 5); // Get first 5 question IDs
    
    const questionsQuery = 'SELECT * FROM questions WHERE id = ANY($1)';
    const questionsResult = await pool.query(questionsQuery, [questionsSample]);
    
    console.log(`Found ${questionsResult.rows.length} out of ${questionsSample.length} questions in the questions table`);
    
    if (questionsResult.rows.length === 0) {
      console.log('No matching questions found in the questions table');
      return;
    }
    
    // 5. Print the first question's details
    console.log('First question details:');
    console.log(questionsResult.rows[0]);
    
    // 6. Check the schema of the questions table
    const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions'
    `;
    const schemaResult = await pool.query(schemaQuery);
    
    console.log('Questions table schema:');
    schemaResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // 7. Try the full join query that's failing
    const fullQuery = `
      SELECT q.id, q.ques, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option as answer,
             q.explanation, q.difficulty_level, q.reference, q.topic,
             eq.marks, eq.question_order,
             ch.name as chapter_name, s.name as subject_name, c.name as class_name
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      LEFT JOIN chapters ch ON q.chapter = ch.id
      LEFT JOIN subjects s ON ch.subject_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE eq.exam_id = $1
      ORDER BY eq.question_order
    `;
    
    try {
      const fullResult = await pool.query(fullQuery, [examId]);
      console.log(`Full join query returned ${fullResult.rows.length} results`);
      
      if (fullResult.rows.length > 0) {
        console.log('First result from full join:');
        console.log(fullResult.rows[0]);
      }
    } catch (error) {
      console.error('Error executing full join query:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing exam questions:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get exam ID from command line or use default
const examId = process.argv[2] || 1;

// Run the test
testExamQuestions(examId);
