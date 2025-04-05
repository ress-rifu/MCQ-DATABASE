const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testExamCreation() {
  try {
    // First, check if the course_id column exists
    const columnCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'exams' AND column_name = 'course_id'
    `;

    const columnResult = await pool.query(columnCheckQuery);
    console.log('Column check result:', columnResult.rows);

    if (columnResult.rows.length === 0) {
      console.log('The course_id column does not exist in the exams table!');
      return;
    }

    // Try to create a simple exam
    const insertQuery = `
      INSERT INTO exams (
        title, description, start_datetime, end_datetime,
        negative_marking, shuffle_questions,
        can_change_answer, duration_minutes, total_marks,
        course_id
      )
      VALUES (
        'Test Exam', 'Test Description', NOW(), NOW() + INTERVAL '1 day',
        false, false,
        true, 60, 100,
        NULL
      )
      RETURNING id
    `;

    const result = await pool.query(insertQuery);
    console.log('Exam created with ID:', result.rows[0].id);

    // Clean up - delete the test exam
    await pool.query('DELETE FROM exams WHERE id = $1', [result.rows[0].id]);
    console.log('Test exam deleted');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testExamCreation();
