const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  console.log('Auth middleware running for:', req.originalUrl);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(403).json({ message: "Access Denied - No Auth Header" }); 
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    console.log('Authorization header format invalid:', authHeader);
    return res.status(403).json({ message: "Access Denied - Invalid Auth Format" }); 
  }

  const token = authHeader.split(" ")[1];
  console.log('Token received, attempting to verify');
  console.log('Token first 20 chars:', token.substring(0, 20) + '...');

  try {
    // Clean up JWT_SECRET by removing any newlines, same as in auth.js
    const jwtSecret = (process.env.JWT_SECRET || 'default_secret').replace(/\n/g, '');
    console.log('JWT_SECRET length:', jwtSecret.length);
    
    // Log token parts for debugging (without revealing the full token)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Token payload:', payload);
      } catch (decodeErr) {
        console.error('Error decoding token payload:', decodeErr.message);
      }
    } else {
      console.error('Token does not have three parts as expected in JWT format');
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token verified successfully, user:', decoded);
    req.user = decoded; 
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired", error: err.message });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token signature", error: err.message });
    } else {
      return res.status(401).json({ message: "Invalid Token", error: err.message });
    }
  }
};
