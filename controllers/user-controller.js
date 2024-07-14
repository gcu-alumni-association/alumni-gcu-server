const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../middleware/generate-token');
const nodemailer = require('nodemailer');
const { validationResult } = require("express-validator"); //For validation


const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

    const { name, email, phone, batch, branch } = req.body;
    try {
      const user = new User({ name, email, phone, batch, branch });
      await user.save();  
      console.log('New user registration pending approval:', user); 
      res.status(201).json({ message: 'Registration successful, pending admin approval.' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };

  
  const pendingUsers = async (req, res) => {
      //console.log('Pending users route accessed');
      try {
      const users = await User.find({ isVerified: false });
      res.json(users);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const approve = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

    const { email } = req.body;
    
    try {
        // Find the user by email in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate a dummy password and hash it
        const dummyPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(dummyPassword, 10);
        
        // Update user data in the database (approve user and set dummy password)
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
      
      // Send approval email using Nodemailer with Ethereal
      const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
              user: 'mayra.rau74@ethereal.email',
              pass: 'CssjERRDPCrwvKxt23'
            }
        });
        
        const mailOptions = {
            from: 'mayra.rau74@ethereal.email',
            to: user.email,
            subject: 'Account Approved',
            text: `Your account has been approved. Your temporary password is ${dummyPassword}`
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error.message);
                return res.status(500).json({ error: 'Failed to send approval email' });
            }
            console.log('Email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            res.json({ message: 'User approved and email sent' });
        });
        
    } catch (error) {
        console.error('Approval process error:', error);
        res.status(500).json({ error: 'Server error' });
    }
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
  
      const accessToken = generateToken(user, process.env.JWT_SECRET, '30m');
      const refreshToken = generateToken(user, process.env.JWT_SECRET, '30d');

      res.cookie('GCUACCTKN', accessToken , {
        httpOnly: true 
      });
      res.cookie('GCUREFRSTKN', refreshToken , {
        httpOnly: true 
      });
      res.json({message: "Login Successful"})
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };

const getUser = async (req, res) =>{
  try{
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found'})
    }
    res.json(user);
    } catch(error) {
      res.status(500).json({ error: 'Server error' });
      }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { biography, currentWorkingPlace, socialLinks } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.biography = biography || user.biography;
    user.currentWorkingPlace = currentWorkingPlace || user.currentWorkingPlace;
    user.socialLinks = {
      linkedin: socialLinks.linkedin || user.socialLinks.linkedin,
      facebook: socialLinks.facebook || user.socialLinks.facebook
    };

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const reset_password = async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, oldPassword, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
      res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);      
        res.status(500).json({ error: 'Server error' });
    }
};

const getVerifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true }).select('name biography');
    res.json(users);
  } catch (error) {
    console.error('Error fetching verified users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const checkAuth = (req, res) => {
    res.json({ isAuthenticated: true, role: req.user.role});
}

const logout = async (req, res ) => {
    res.clearCookie('GCUACCTKN');
    res.clearCookie('GCUREFRSTKN');
    res.json({ message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dummyPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(dummyPassword, 10);

    user.password = hashedPassword;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mayra.rau74@ethereal.email',
        pass: 'CssjERRDPCrwvKxt23'
      }
    });

    const mailOptions = {
      from: 'mayra.rau74@ethereal.email',
      to: user.email,
      subject: 'Password Reset',
      text: `Your new temporary password is: ${dummyPassword}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error.message);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }
      console.log('Email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'Password reset email sent' });
    });
  } catch (error) {
    console.error('Forgot Password process error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
    login,
    reset_password,
    logout,
    approve,
    pendingUsers,
    register,
    checkAuth, 
    getUser,
    updateProfile,
    getVerifiedUsers,
    forgotPassword
}
