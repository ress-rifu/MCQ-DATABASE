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