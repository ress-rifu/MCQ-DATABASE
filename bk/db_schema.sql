-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, chapter_id)
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create course_content table to manage relationships between courses and curriculum items (classes, subjects, chapters)
CREATE TABLE IF NOT EXISTS course_content (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- At least one of class_id, subject_id, or chapter_id must be provided
  CONSTRAINT at_least_one_content_item CHECK (
    (class_id IS NOT NULL) OR 
    (subject_id IS NOT NULL) OR 
    (chapter_id IS NOT NULL)
  ),
  CONSTRAINT unique_course_content UNIQUE (course_id, class_id, subject_id, chapter_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_content_course_id ON course_content(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_class_id ON course_content(class_id);
CREATE INDEX IF NOT EXISTS idx_course_content_subject_id ON course_content(subject_id);
CREATE INDEX IF NOT EXISTS idx_course_content_chapter_id ON course_content(chapter_id);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  negative_marking BOOLEAN DEFAULT FALSE,
  negative_percentage DECIMAL(5,2),
  shuffle_questions BOOLEAN DEFAULT FALSE,
  can_change_answer BOOLEAN DEFAULT TRUE,
  syllabus TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  course_id INTEGER REFERENCES courses(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_chapters table for associating exams with multiple chapters
CREATE TABLE IF NOT EXISTS exam_chapters (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, chapter_id)
);

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS exam_questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  marks INTEGER DEFAULT 1,
  question_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, question_id)
);

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  score DECIMAL(10,2) DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, user_id)
);

-- Create exam_responses table
CREATE TABLE IF NOT EXISTS exam_responses (
  id SERIAL PRIMARY KEY,
  exam_attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_option VARCHAR(1),
  is_correct BOOLEAN,
  marks_obtained DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_attempt_id, question_id)
); 