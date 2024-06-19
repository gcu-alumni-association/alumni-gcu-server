const User = require('../model/User');

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

exports.pendingUsers = pendingUsers;