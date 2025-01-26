const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const User = require('../model/User');
const Post = require('../model/Post');
const Feedback = require('../model/Feedback');
const { verifyToken, checkAdmin, checkSuperUser } = require('../middleware/verify-token');
const {
  approve,
  pendingUsers,
  rejectUser,
  approvedUsers,
  bulkAddAlumni,
  sendEmail,
  createAdmin,
  getAdmins,
} = require("../controllers/admin-controller");

// File upload middleware
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp directory for CSV uploads

router.post("/create-admin", [
  check("name").isString().notEmpty(),
  check("email").isEmail(),
  check("password").isLength({ min: 8 }),
], verifyToken, checkSuperUser, createAdmin);

router.get("/get-admins", verifyToken, checkSuperUser, getAdmins);

router.post("/approve", [
  check("email").isEmail()
], verifyToken, checkAdmin, approve);

router.post("/reject-user", [
  check("email").isEmail()
], verifyToken, checkAdmin, rejectUser);

router.get("/pending-users", verifyToken, checkAdmin, pendingUsers);

router.get("/approved-users", verifyToken, checkAdmin, approvedUsers);

// Route for bulk adding alumni records (CSV upload)
router.post("/bulk-add-alumni", verifyToken, checkAdmin, upload.single('file'), bulkAddAlumni);

router.post("/send-emails", verifyToken, checkAdmin, async (req, res) => {
  const { batch, branch } = req.query; // Extract batch and branch from query params
  const { subject, message } = req.body; // Extract subject and message from request body

  // Input Validation
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  if (batch && isNaN(batch)) {
    return res.status(400).json({ error: 'Batch must be a valid number.' });
  }

  try {
    const filter = { isVerified: true };

    if (batch) {
      filter.batch = Number(batch); // Add batch filter if provided
    }
    if (branch) {
      filter.branch = branch; // Add branch filter if provided
    }

    // Database Operation with Error Handling
    let users;
    try {
      users = await User.find(filter).select('email');
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return res.status(500).json({ error: 'Error fetching users from the database.' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found for the selected criteria.' });
    }

    // Email Sending with Error Handling
    try {
      await sendEmail(users, message, subject);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ error: 'Error sending emails. Please try again later.' });
    }

    res.status(200).json({ message: 'Emails sent successfully!' });
  } catch (error) {
    // Global Catch Block for Unforeseen Errors
    console.error('Unexpected server error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
});

// Total Metrics
router.get('/metrics', verifyToken, checkAdmin, async (req, res) => {
  try {
      const totalUsers = await User.countDocuments({ isVerified: true });
      const totalUnverifiedUsers = await User.countDocuments({ isVerified: false });
      const totalPosts = await Post.countDocuments();
      const totalComments = await Post.aggregate([
          { $unwind: "$comments" },
          { $count: "totalComments" }
      ]);
      const totalFeedback = await Feedback.countDocuments();

      res.json({
          totalUsers,
          totalUnverifiedUsers,
          totalPosts,
          totalComments: totalComments[0]?.totalComments || 0,
          totalFeedback
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Monthly User Registrations
router.get('/users/registrations', verifyToken, checkAdmin, async (req, res) => {
  try {
      const registrations = await User.aggregate([
          {
              $group: {
                  _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                  count: { $sum: 1 }
              }
          },
          {
              $sort: { "_id.year": 1, "_id.month": 1 }
          }
      ]);

      const formattedData = registrations.map(item => ({
          month: item._id.year && item._id.month ? `${item._id.year}-${item._id.month}` : 'Unknown',
          count: item.count
      }));

      res.json({ data: formattedData });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch user registrations' });
  }
});

// Posts by Category
router.get('/posts/categories', verifyToken, checkAdmin, async (req, res) => {
  try {
      const categories = await Post.aggregate([
          {
              $group: {
                  _id: "$category",
                  count: { $sum: 1 }
              }
          }
      ]);

      const formattedData = categories.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
      }, {});

      res.json({ categories: formattedData });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch posts by category' });
  }
});

// Top Active Users
router.get('/users/active', verifyToken, checkAdmin, async (req, res) => {
  try {
      const activeUsers = await Post.aggregate([
          {
              $group: {
                  _id: "$author",
                  postCount: { $sum: 1 }
              }
          },
          {
              $sort: { postCount: -1 }
          },
          {
              $limit: 10
          },
          {
              $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user"
              }
          },
          {
              $unwind: "$user"
          },
          {
              $project: {
                  name: "$user.name",
                  email: "$user.email",
                  postCount: 1
              }
          }
      ]);

      res.json({ users: activeUsers });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch top active users' });
  }
});

// Flagged Posts
router.get('/flagged-posts', verifyToken, checkAdmin, async (req, res) => {
  try {
      const flaggedPosts = await Post.find({ flagged: true })
          .populate('author', 'name batch branch');
      res.status(200).json(flaggedPosts);
  } catch (err) {
      console.error('Error fetching flagged posts:', err);
      res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
