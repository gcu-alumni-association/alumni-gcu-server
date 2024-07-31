const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator"); //For validation


const generateToken = (user, secret, expiresIn ) => {
    return jwt.sign({ id: user._id, role: user.role }, secret , { expiresIn })
};

const login = async (req, res) => {
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
      try {
        const user = await User.findOne({ email });
        if (!user || !user.isVerified) return res.status(400).json({ message: 'Invalid credentials' });
        //use salt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
        const accessToken = generateToken(user, process.env.JWT_SECRET, '30s');
        const refreshToken = generateToken(user, process.env.JWT_REFRESH_SECRET, '30d');
  
        res.cookie('GCURFRSTKN', refreshToken , {
          httpOnly: true,
          // secure: true,
            // sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000 //expiry 30 days
        });
        
        //Sending accessToken 
      res.json({ accessToken, message: "Login Successful", user})
        
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
};

const refresh_token = async (req, res) => {
    const refreshToken = req.cookies.GCURFRSTKN;
  
    if (!refreshToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      const accessToken = generateToken(user, process.env.JWT_SECRET, '30s'); // Adjust the duration as needed
  
      res.json({ accessToken, message: 'Access token refreshed', user });
    } catch (err) {
      console.error('Refresh token error:', err);
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Refresh token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Invalid refresh token' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  const logout = async (req, res ) => {
    res.clearCookie('GCURFRSTKN');
    res.json({ message: 'Logged out successfully' });
};

module.exports = {
    login,
    refresh_token,
    logout,
}