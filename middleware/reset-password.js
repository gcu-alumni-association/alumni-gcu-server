const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const reset_password = async (req, res) => {
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
      res.status(500).json({ error: 'Server error' });
    }
  };

exports.reset_password = reset_password;
