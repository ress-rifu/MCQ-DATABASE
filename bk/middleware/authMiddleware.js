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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully, user:', decoded);
    req.user = decoded; 
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ message: "Invalid Token", error: err.message });  
  }
};
