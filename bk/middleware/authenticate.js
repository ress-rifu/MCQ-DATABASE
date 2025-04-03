const jwt = require('jsonwebtoken');
require('dotenv').config();

// Secret key for JWT
const secretKey = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticateToken = (req, res, next) => {
    // Log the endpoint being accessed
    console.log(`Authentication middleware for: ${req.method} ${req.originalUrl}`);
    
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN
    
    console.log(`Auth middleware: Processing token - ${token ? 'Token present' : 'No token'}`);
    
    if (!token) {
        console.log('Auth middleware: No token provided');
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Log the current secret key being used (for debugging)
    const secretKeyLength = secretKey ? secretKey.length : 0;
    console.log(`Auth middleware: Using JWT secret of length ${secretKeyLength}`);
    
    // Verify the token
    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.error('Auth middleware: Token verification failed -', err.message);
            console.error('Auth middleware: Token verification error details -', err);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: 'Invalid token signature' });
            } else {
                return res.status(403).json({ message: `Invalid token: ${err.message}` });
            }
        }
        
        // Log the verification success
        console.log(`Auth middleware: Verified user ID ${user.id || 'unknown'}, role ${user.role || 'none'}`);
        console.log('Auth middleware: Decoded token payload:', JSON.stringify(user));
        
        // If token is valid, save user info to request for use in routes
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken }; 