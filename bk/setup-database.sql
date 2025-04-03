-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, class_id)
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, subject_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  qserial VARCHAR(20),
  classname VARCHAR(50),
  subject VARCHAR(100),
  chapter VARCHAR(100),
  topic VARCHAR(100),
  ques TEXT,
  ques_img TEXT,
  option_a TEXT,
  option_a_img TEXT,
  option_b TEXT,
  option_b_img TEXT,
  option_c TEXT,
  option_c_img TEXT,
  option_d TEXT,
  option_d_img TEXT,
  answer VARCHAR(10),
  explanation TEXT,
  explanation_img TEXT,
  hint TEXT,
  hint_img TEXT,
  difficulty_level VARCHAR(20),
  reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default classes
INSERT INTO classes (name)
VALUES 
  ('Class 6'),
  ('Class 7'),
  ('Class 8'),
  ('Class 9'),
  ('Class 10')
ON CONFLICT (name) DO NOTHING;

-- Insert default subjects for classes 6, 7, 8
DO $$
DECLARE
  current_class_id INTEGER;
BEGIN
  FOR current_class_id IN 1..3 LOOP
    INSERT INTO subjects (name, class_id)
    VALUES 
      ('Bangla 1st', current_class_id),
      ('Bangla 2nd', current_class_id),
      ('English 1st', current_class_id),
      ('English 2nd', current_class_id),
      ('General Math', current_class_id),
      ('Science', current_class_id),
      ('ICT', current_class_id),
      ('BGS', current_class_id)
    ON CONFLICT (name, class_id) DO NOTHING;
  END LOOP;
END $$;

-- Insert default subjects for classes 9, 10
DO $$
DECLARE
  current_class_id INTEGER;
BEGIN
  FOR current_class_id IN 4..5 LOOP
    INSERT INTO subjects (name, class_id)
    VALUES 
      ('Bangla 1st', current_class_id),
      ('Bangla 2nd', current_class_id),
      ('English 1st', current_class_id),
      ('English 2nd', current_class_id),
      ('General Math', current_class_id),
      ('Higher Math', current_class_id),
      ('Science', current_class_id),
      ('Physics', current_class_id),
      ('Chemistry', current_class_id),
      ('Biology', current_class_id),
      ('ICT', current_class_id),
      ('BGS', current_class_id)
    ON CONFLICT (name, class_id) DO NOTHING;
  END LOOP;
END $$; 