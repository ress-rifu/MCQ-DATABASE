-- Migration to add exam settings fields to the exams table

-- Basic Settings (some already exist)
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS introduction TEXT;

-- Question Settings
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS pagination_type VARCHAR(20) DEFAULT 'all' CHECK (pagination_type IN ('all', 'one_per_page')),
ADD COLUMN IF NOT EXISTS allow_blank_answers BOOLEAN DEFAULT TRUE,
-- shuffle_questions and negative_marking already exist

-- Review Settings
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS conclusion_text TEXT,
ADD COLUMN IF NOT EXISTS show_custom_result_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pass_message TEXT,
ADD COLUMN IF NOT EXISTS fail_message TEXT,
ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_test_outline BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_correct_incorrect BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_correct_answer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_explanation BOOLEAN DEFAULT TRUE;

-- Access Control
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) DEFAULT 'anyone' CHECK (access_type IN ('anyone', 'passcode', 'identifier_list', 'email_list')),
ADD COLUMN IF NOT EXISTS access_passcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS identifier_list TEXT[], -- Array of allowed identifiers
ADD COLUMN IF NOT EXISTS email_list TEXT[], -- Array of allowed emails
ADD COLUMN IF NOT EXISTS time_limit_type VARCHAR(20) DEFAULT 'specified' CHECK (time_limit_type IN ('unlimited', 'specified')),
-- duration_minutes already exists
ADD COLUMN IF NOT EXISTS attempt_limit_type VARCHAR(20) DEFAULT 'unlimited' CHECK (attempt_limit_type IN ('unlimited', 'limited')),
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS identifier_prompt TEXT DEFAULT 'Enter your name';

-- Browser Functionality
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS disable_right_click BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_copy_paste BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_translate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_autocomplete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_spellcheck BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_printing BOOLEAN DEFAULT FALSE;

-- Create index for better performance on access control lookups
CREATE INDEX IF NOT EXISTS idx_exams_access_type ON exams(access_type); 