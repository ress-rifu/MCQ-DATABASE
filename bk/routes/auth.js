const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Helper function to find user by email
const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email.trim()]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

// Sign Up Route (hashes the password before storing)
router.post('/signup', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;

    try {
        // Check if the user already exists
        const userExists = await findUserByEmail(email);
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database with the hashed password
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hashedPassword, 'user']
        );

        // Create JWT token
        const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Exclude password before sending the user details in response
        const { password: _, ...userWithoutPassword } = newUser.rows[0];

        // Send the token and user details
        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route (compares the plaintext password with the hashed password)
router.post('/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    console.log('Login attempt with password:', password);

    try {
        // Find the user by email
        console.log('Attempting to find user by email');
        const user = await findUserByEmail(email);
        console.log('User found:', user ? 'Yes' : 'No');
        console.log('User details:', user);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the entered password (plaintext) with the stored hashed password
        console.log('Comparing passwords');
        console.log('Input password:', password);
        console.log('Stored password:', user.password);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        console.log('Creating JWT token');
        // Clean up JWT_SECRET by removing any newlines
        const jwtSecret = process.env.JWT_SECRET.replace(/\n/g, '');
        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });

        // Exclude the password before sending the response
        const { password: _, ...userWithoutPassword } = user;

        // Send token and user details (without password)
        console.log('Login successful, sending response');
        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
