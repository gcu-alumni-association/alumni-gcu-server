const express = require('express');
const router = express.Router();
const User = require('../model/User'); // Adjust the path according to your project structure

router.get('/verified-users', async (req, res) => {
  try {
    const verifiedUsers = await User.find({ isVerified: true });
    res.json(verifiedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
