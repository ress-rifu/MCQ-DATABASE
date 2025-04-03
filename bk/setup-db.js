require('dotenv').config();
const pool = require('./db');

// Log the environment variables for debugging
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

const createTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);
    console.log('Users table created or already exists');

    // Create classes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Classes table created or already exists');

    // Create subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, class_id)
      );
    `);
    console.log('Subjects table created or already exists');

    // Create chapters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, subject_id)
      );
    `);
    console.log('Chapters table created or already exists');

    // Don't drop existing questions table if it exists
    // Modified questions table to reference the new structure
    await pool.query(`
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
    `);
    console.log('Questions table created or already exists');

    // Insert default classes
    await pool.query(`
      INSERT INTO classes (name)
      VALUES 
        ('Class 6'),
        ('Class 7'),
        ('Class 8'),
        ('Class 9'),
        ('Class 10')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('Default classes added');

    // Insert default subjects for classes 6, 7, 8
    for (let classId = 1; classId <= 3; classId++) {
      await pool.query(`
        INSERT INTO subjects (name, class_id)
        SELECT s.name, c.id FROM 
        (VALUES 
          ('Bangla 1st'),
          ('Bangla 2nd'),
          ('English 1st'),
          ('English 2nd'),
          ('General Math'),
          ('Science'),
          ('ICT'),
          ('BGS')
        ) AS s(name)
        CROSS JOIN (SELECT id FROM classes WHERE id = $1) AS c
        ON CONFLICT (name, class_id) DO NOTHING;
      `, [classId]);
    }
    console.log('Default subjects for classes 6, 7, 8 added');

    // Insert default subjects for classes 9, 10
    for (let classId = 4; classId <= 5; classId++) {
      await pool.query(`
        INSERT INTO subjects (name, class_id)
        SELECT s.name, c.id FROM 
        (VALUES 
          ('Bangla 1st'),
          ('Bangla 2nd'),
          ('English 1st'),
          ('English 2nd'),
          ('General Math'),
          ('Higher Math'),
          ('Science'),
          ('Physics'),
          ('Chemistry'),
          ('Biology'),
          ('ICT'),
          ('BGS')
        ) AS s(name)
        CROSS JOIN (SELECT id FROM classes WHERE id = $1) AS c
        ON CONFLICT (name, class_id) DO NOTHING;
      `, [classId]);
    }
    console.log('Default subjects for classes 9, 10 added');

    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
};

createTables(); 