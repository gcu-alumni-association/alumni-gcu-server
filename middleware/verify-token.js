const jwt = require('jsonwebtoken');
require('dotenv').config(); // Import your JWT secret key and any other configurations

const verifyToken = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.GCUACCTKN; 
  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
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


const refresh_token = (req, res) => {
  const refreshToken = req.cookies.GCUREFRSTKN;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  };

  try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = { id: decoded.id, role: decoded.role };
      const newAccessToken = generateToken(user, process.env.JWT_SECRET, '30m');
  
      res.cookie('GCUACCTKN', newAccessToken, { 
          httpOnly: true
      });
      res.json({ message: 'Access token refreshed' });
    } catch (err) {
      console.error('Refresh token error:', err);
      res.status(401).json({ msg: 'Refresh token is not valid' });
  }
}

const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({message: 'Access denied, Admin only'})
    }
    next();
}

module.exports = { verifyToken, checkAdmin, refresh_token};