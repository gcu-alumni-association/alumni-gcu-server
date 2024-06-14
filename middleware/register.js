const User = require('../model/User');


const register = async (req, res) => {
    const { name, email, phone } = req.body;
    try {
      const user = new User({ name, email, phone });
      await user.save();
  
      console.log('New user registration pending approval:', user);
  
      res.status(201).json({ message: 'Registration successful, pending admin approval.' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };

exports.register = register;  