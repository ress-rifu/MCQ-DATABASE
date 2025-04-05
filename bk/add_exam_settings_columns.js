require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addExamSettingsColumns() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Basic Settings
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS introduction TEXT');
    
    // Question Settings
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS pagination_type VARCHAR(20) DEFAULT \'all\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_blank_answers BOOLEAN DEFAULT TRUE');
    
    // Review Settings
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS conclusion_text TEXT');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_custom_result_message BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS pass_message TEXT');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS fail_message TEXT');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 60');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT TRUE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_test_outline BOOLEAN DEFAULT TRUE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_correct_incorrect BOOLEAN DEFAULT TRUE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_correct_answer BOOLEAN DEFAULT TRUE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_explanation BOOLEAN DEFAULT TRUE');
    
    // Access Control
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) DEFAULT \'anyone\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_passcode VARCHAR(100)');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS identifier_list TEXT[] DEFAULT \'{}\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS email_list TEXT[] DEFAULT \'{}\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS time_limit_type VARCHAR(20) DEFAULT \'unlimited\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS attempt_limit_type VARCHAR(20) DEFAULT \'unlimited\'');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS identifier_prompt VARCHAR(255) DEFAULT \'Enter your name\'');
    
    // Browser Settings
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_right_click BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_copy_paste BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_translate BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_autocomplete BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_spellcheck BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE exams ADD COLUMN IF NOT EXISTS disable_printing BOOLEAN DEFAULT FALSE');
    
    await client.query('COMMIT');
    console.log('Successfully added all exam settings columns');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding exam settings columns:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addExamSettingsColumns();
