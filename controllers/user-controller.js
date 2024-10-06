const User = require('../model/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require("express-validator"); //For validation


const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, batch, branch, roll_no, password } = req.body;

  // Ensure batch is a valid year
  const currentYear = new Date().getFullYear();
  if (batch < 2006 || batch > currentYear + 4) {
    return res.status(400).json({ error: 'Batch must be a valid year between 1900 and ' + (currentYear + 4) });
  }

  try {
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      batch,
      branch,
      roll_no,
      password: hashedPassword // Save hashed password
    });

    await user.save();
    console.log('New user registered:', user);

    res.status(201).json({ message: 'Registration successful, pending admin approval.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUser = async (req, res) =>{
  try{
    const user = await User.findById(req.user.id).select("-password");
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

const getUserById = async (req, res) => {
  try {
    // Find user by ID from request params and exclude password
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const recommendUsers = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user.id); // Fetch logged-in user

    if (!loggedInUser) {
      return res.status(404).json({ message: 'Logged in user not found' });
    }

    // Fetch users from the same batch or branch, excluding the logged-in user
    const recommendedUsers = await User.find({
      _id: { $ne: loggedInUser._id },
      isVerified: true, 
      role: 'user',
      $or: [
        { batch: loggedInUser.batch },  // Recommend batchmates
        { branch: loggedInUser.branch } // Recommend branchmates
      ]
    }).limit(10).select('name branch batch');

    res.json(recommendedUsers);
  } catch (error) {
    console.error('Error fetching recommended users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getVerifiedUsers = async (req, res) => {
  const { search } = req.query; // Get search term from query parameters

  try {
    const query = {
      _id: { $ne: req.user.id },
      isVerified: true,
      role: 'user',
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex for string fields

      // Add conditions for name and branch (strings)
      query.$or = [
        { name: { $regex: searchRegex } },
        { branch: { $regex: searchRegex } },
      ];

      // If the search is a valid number, add it to the batch filter
      const searchNumber = parseInt(search, 10);
      if (!isNaN(searchNumber)) {
        query.$or.push({ batch: searchNumber });
      }
    }

    const users = await User.find(query).select('name branch batch');
    res.json(users);
  } catch (error) {
    console.error('Error fetching verified users:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } },
      { runValidators: false }  //no more validation of the other fields but only password
    );

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

// Route to check email availability
const checkEmail = async (req, res) => {
  const { email } = req.body;
  try {
      const user = await User.findOne({ email });
      if (user) {
          return res.json({ available: false });
      }
      return res.json({ available: true });
  } catch (error) {
      console.error('Error checking email availability:', error);
      return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
    reset_password,
    register,
    getUser,
    updateProfile,
    getVerifiedUsers,
    forgotPassword, 
    checkEmail,
    getUserById,
    recommendUsers
}
