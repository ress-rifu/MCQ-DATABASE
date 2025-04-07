-- Migration to add exam settings fields to the exams table

-- Basic Settings (some already exist)
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS introduction TEXT;

-- Question Settings
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS pagination_type VARCHAR(20) DEFAULT 'all';

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS allow_blank_answers BOOLEAN DEFAULT TRUE;
-- shuffle_questions and negative_marking already exist

-- Review Settings
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS conclusion_text TEXT;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_custom_result_message BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS pass_message TEXT;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS fail_message TEXT;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 60;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT TRUE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_test_outline BOOLEAN DEFAULT TRUE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_correct_incorrect BOOLEAN DEFAULT TRUE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_correct_answer BOOLEAN DEFAULT TRUE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS show_explanation BOOLEAN DEFAULT TRUE;

-- Access Control
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) DEFAULT 'anyone';

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS access_passcode VARCHAR(100);

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS identifier_list TEXT[]; -- Array of allowed identifiers

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS email_list TEXT[]; -- Array of allowed emails

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS time_limit_type VARCHAR(20) DEFAULT 'specified';
-- duration_minutes already exists

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS attempt_limit_type VARCHAR(20) DEFAULT 'unlimited';

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS identifier_prompt TEXT DEFAULT 'Enter your name';

-- Browser Functionality
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_right_click BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_copy_paste BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_translate BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_autocomplete BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_spellcheck BOOLEAN DEFAULT FALSE;

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS disable_printing BOOLEAN DEFAULT FALSE;

-- Create index for better performance on access control lookups
CREATE INDEX IF NOT EXISTS idx_exams_access_type ON exams(access_type);