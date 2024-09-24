const User = require('../model/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require("express-validator"); //For validation


// const register = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//     const { name, email, phone, batch, branch } = req.body;
//     try {
//       const user = new User({ name, email, phone, batch, branch });
//       await user.save();  
//       console.log('New user registration pending approval:', user); 
//       res.status(201).json({ message: 'Registration successful, pending admin approval.' });
//     } catch (error) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   };

  
const pendingUsers = async (req, res) => {
      try {
      const users = await User.find({ isVerified: false });
      res.json(users);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const approvedUsers = async (req, res) => {
  const { batch, branch } = req.query; // Extract batch and branch from query params

  try {
    const filter = { isVerified: true };

    if (batch) {
      filter.batch = Number(batch); // Add batch filter if provided
    }
    if (branch) {
      filter.branch = branch; // Add branch filter if provided
    }

    const users = await User.find(filter).select('-password -__v -_id -isVerified -role');
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
  
      // Approve the user by setting isVerified to true
      user.isVerified = true;
      await user.save();
  
      res.json({ message: 'User approved successfully' });
    } catch (error) {
      console.error('Approval process error:', error);
      res.status(500).json({ error: 'Server error' });
    }
};
  
const rejectUser = async (req, res) => {
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
        
        // Delete the user from the database
        await User.deleteOne({ email });
        
        res.json({ message: 'User rejected and deleted successfully' });
    } catch (error) {
        console.error('Reject user process error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const sendEmail = async (user, dummyPassword) => {
    try {
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
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new Error('Failed to send approval email');
    }
};



module.exports = {
    approve,
    pendingUsers,
    rejectUser,
    sendEmail, 
    approvedUsers
}
