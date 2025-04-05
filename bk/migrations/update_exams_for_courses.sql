-- Migration script to update exams table to use courses instead of direct class/subject/chapter references
-- and to support multiple chapters per exam

-- First create the exam_chapters table if it doesn't exist already
CREATE TABLE IF NOT EXISTS exam_chapters (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, chapter_id)
);

-- Before dropping columns, let's migrate existing exams
-- First, add the course_id column if it doesn't exist
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id);

-- Migrate existing exams to the new schema:
-- 1. Create a temporary table to store exam-chapter relationships
CREATE TEMP TABLE temp_exam_chapters (
  exam_id INTEGER,
  chapter_id INTEGER
);

-- 2. For existing exams with a chapter_id, save the relationship
INSERT INTO temp_exam_chapters (exam_id, chapter_id)
SELECT id, chapter_id FROM exams 
WHERE chapter_id IS NOT NULL;

-- 3. Now insert these relationships into the exam_chapters table
INSERT INTO exam_chapters (exam_id, chapter_id)
SELECT exam_id, chapter_id FROM temp_exam_chapters
ON CONFLICT DO NOTHING;

-- 4. Drop the columns that are no longer needed
ALTER TABLE exams 
DROP COLUMN IF EXISTS class_id,
DROP COLUMN IF EXISTS subject_id, 
DROP COLUMN IF EXISTS chapter_id;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_chapters_exam_id ON exam_chapters(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_chapters_chapter_id ON exam_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);

-- Update functions or triggers that might rely on the old schema
-- Add any other schema changes needed 