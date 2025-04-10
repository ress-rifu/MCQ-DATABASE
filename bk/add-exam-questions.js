// Script to add questions to an exam
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/question_db'
});

// Function to add questions to an exam
async function addQuestionsToExam(examId) {
  console.log(`Adding questions to exam ID: ${examId}`);
  
  try {
    // 1. Check if the exam exists
    const examQuery = 'SELECT * FROM exams WHERE id = $1';
    const examResult = await pool.query(examQuery, [examId]);
    
    if (examResult.rows.length === 0) {
      console.log(`No exam found with ID: ${examId}`);
      return;
    }
    
    console.log(`Found exam: ${examResult.rows[0].title}`);
    
    // 2. Get available questions from the questions table
    const questionsQuery = 'SELECT id FROM questions LIMIT 10';
    const questionsResult = await pool.query(questionsQuery);
    
    if (questionsResult.rows.length === 0) {
      console.log('No questions available in the database');
      return;
    }
    
    console.log(`Found ${questionsResult.rows.length} questions to add to the exam`);
    
    // 3. Add questions to the exam_questions table
    const questionIds = questionsResult.rows.map(row => row.id);
    
    // First check if these questions are already added to the exam
    const checkQuery = 'SELECT question_id FROM exam_questions WHERE exam_id = $1 AND question_id = ANY($2)';
    const checkResult = await pool.query(checkQuery, [examId, questionIds]);
    
    const existingQuestionIds = checkResult.rows.map(row => row.question_id);
    const newQuestionIds = questionIds.filter(id => !existingQuestionIds.includes(id));
    
    console.log(`${existingQuestionIds.length} questions already added to the exam`);
    console.log(`Adding ${newQuestionIds.length} new questions to the exam`);
    
    if (newQuestionIds.length === 0) {
      console.log('No new questions to add');
      return;
    }
    
    // Add the questions to the exam
    for (let i = 0; i < newQuestionIds.length; i++) {
      const questionId = newQuestionIds[i];
      const questionOrder = i + 1;
      const marks = 1; // Default marks per question
      
      const insertQuery = `
        INSERT INTO exam_questions (exam_id, question_id, question_order, marks)
        VALUES ($1, $2, $3, $4)
      `;
      
      await pool.query(insertQuery, [examId, questionId, questionOrder, marks]);
      console.log(`Added question ID ${questionId} to exam ID ${examId}`);
    }
    
    console.log(`Successfully added ${newQuestionIds.length} questions to exam ID ${examId}`);
    
  } catch (error) {
    console.error('Error adding questions to exam:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get exam ID from command line or use default
const examId = process.argv[2] || 1;

// Run the function
addQuestionsToExam(examId);
