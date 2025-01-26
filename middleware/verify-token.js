const jwt = require('jsonwebtoken');
require('dotenv').config(); // Import your JWT secret key and any other configurations

const verifyToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  try {
    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = verified; // Add decoded user information to request object for use in subsequent middleware or route handlers   
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};


const checkAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superuser') {
    return next();
  }
  return res.status(403).json({message: 'Access denied, Admin or Superuser only'});
}

const checkSuperUser = (req, res, next) => {
  if (req.user.role !== 'superuser') {
      return res.status(403).json({message: 'Access denied, Superuser only'})
  }
  next();
}

module.exports = { verifyToken, checkAdmin, checkSuperUser};