const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const User = require('../model/User')
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const {
  approve,
  pendingUsers,
  rejectUser,
  approvedUsers,
  bulkAddAlumni,
  sendEmail,
} = require("../controllers/admin-controller");

// File upload middleware
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp directory for CSV uploads

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


module.exports = router;
