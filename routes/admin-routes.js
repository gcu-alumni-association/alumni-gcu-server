const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const {
  approve,
  pendingUsers,
  rejectUser,
  approvedUsers,
  bulkAddAlumni
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

module.exports = router;
