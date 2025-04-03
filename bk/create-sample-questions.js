const pool = require('./db');

const createSampleQuestions = async () => {
  try {
    // Check if questions already exist
    const checkResult = await pool.query('SELECT COUNT(*) FROM questions');
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Questions already exist in the database');
      process.exit(0);
    }
    
    // Sample questions
    const sampleQuestions = [
      {
        qserial: 'Q001',
        classname: '10',
        subject: 'Mathematics',
        chapter: 'Algebra',
        topic: 'Quadratic Equations',
        ques: 'Solve the equation: x² - 5x + 6 = 0',
        option_a: 'x = 2, x = 3',
        option_b: 'x = -2, x = -3',
        option_c: 'x = 2, x = -3',
        option_d: 'x = -2, x = 3',
        answer: 'A',
        explanation: 'Using factorization: x² - 5x + 6 = (x - 2)(x - 3) = 0, so x = 2 or x = 3',
        difficulty_level: 'Medium',
        reference: 'NCERT Class 10 Mathematics'
      },
      {
        qserial: 'Q002',
        classname: '10',
        subject: 'Science',
        chapter: 'Physics',
        topic: 'Electricity',
        ques: 'What is the SI unit of electric current?',
        option_a: 'Volt',
        option_b: 'Ampere',
        option_c: 'Ohm',
        option_d: 'Watt',
        answer: 'B',
        explanation: 'The SI unit of electric current is the ampere (A).',
        difficulty_level: 'Easy',
        reference: 'NCERT Class 10 Science'
      },
      {
        qserial: 'Q003',
        classname: '11',
        subject: 'Chemistry',
        chapter: 'Chemical Bonding',
        topic: 'Ionic Bonds',
        ques: 'Which of the following compounds has ionic bonding?',
        option_a: 'CO₂',
        option_b: 'CH₄',
        option_c: 'NaCl',
        option_d: 'H₂O',
        answer: 'C',
        explanation: 'NaCl has ionic bonding because it involves the transfer of electrons from Na to Cl.',
        difficulty_level: 'Medium',
        reference: 'NCERT Class 11 Chemistry'
      }
    ];
    
    // Insert sample questions
    for (const question of sampleQuestions) {
      await pool.query(`
        INSERT INTO questions (
          qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d,
          answer, explanation, difficulty_level, reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        question.qserial, question.classname, question.subject, question.chapter, question.topic,
        question.ques, question.option_a, question.option_b, question.option_c, question.option_d,
        question.answer, question.explanation, question.difficulty_level, question.reference
      ]);
    }
    
    console.log('Sample questions created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating sample questions:', err);
    process.exit(1);
  }
};

createSampleQuestions(); 