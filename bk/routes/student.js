// routes/student.js
const express = require('express');
const pool = require('../db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Get student exam results
router.get('/exams', authMiddleware, async (req, res) => {
  try {
    // Ensure the user is a student or admin
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user.id;

    // Get all completed exam attempts for this student with exam details
    const query = `
      SELECT ea.*, e.title, e.description, e.total_marks,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.user_id = $1 AND ea.completed = true
      ORDER BY ea.end_time DESC
    `;

    const result = await pool.query(query, [userId]);

    // Format the response
    const formattedResults = result.rows.map(attempt => ({
      id: attempt.id,
      exam: {
        id: attempt.exam_id,
        title: attempt.title,
        description: attempt.description,
        total_marks: attempt.total_marks,
        question_count: attempt.question_count
      },
      score: attempt.score,
      start_time: attempt.start_time,
      end_time: attempt.end_time,
      percentage: attempt.total_marks > 0 ? 
        Math.round((attempt.score / attempt.total_marks) * 100) : 0
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching student exam results:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Ensure the user is a student or admin
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user.id;

    // Get exam attempts stats
    const attemptsQuery = `
      SELECT 
        COUNT(*) as total_exams,
        COALESCE(AVG(CASE WHEN e.total_marks > 0 THEN (ea.score::float / e.total_marks) * 100 ELSE 0 END), 0) as avg_score,
        COALESCE(MAX(CASE WHEN e.total_marks > 0 THEN (ea.score::float / e.total_marks) * 100 ELSE 0 END), 0) as max_score,
        SUM((SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id)) as total_questions
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.user_id = $1 AND ea.completed = true
    `;

    const result = await pool.query(attemptsQuery, [userId]);
    
    // Format the response
    const stats = {
      totalExams: parseInt(result.rows[0].total_exams) || 0,
      averageScore: parseFloat(result.rows[0].avg_score).toFixed(1) || 0,
      highestScore: parseFloat(result.rows[0].max_score).toFixed(1) || 0,
      totalQuestions: parseInt(result.rows[0].total_questions) || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      totalExams: 0,
      averageScore: 0,
      highestScore: 0,
      totalQuestions: 0
    });
  }
});

module.exports = router;
