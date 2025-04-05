const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all classes
router.get('/classes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM classes ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

// Get subjects for a specific class
router.get('/subjects/by-class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await pool.query(
            'SELECT s.*, c.name as class_name FROM subjects s JOIN classes c ON s.class_id = c.id WHERE s.class_id = $1 ORDER BY s.name',
            [classId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

module.exports = router; 