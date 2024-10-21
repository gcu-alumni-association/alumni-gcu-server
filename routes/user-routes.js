const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { register, reset_password, getUser, updateProfile, getVerifiedUsers, forgotPassword, checkEmail, getUserById, recommendUsers, upload, uploadProfilePhoto, getProfilePhotoById } = require("../controllers/user-controller");
const multer = require('multer');

router.post("/register", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check('phone', "Phone number is required").matches(/^\d{10}$/),
    check('batch', "Batch is required").not().isEmpty(),
    check('branch', "Branch is required").not().isEmpty(),
    check('roll_no', "Roll number must be an integer").isInt(),
    check('password', "Password must be at least 8 characters long").isLength({ min: 8 })
  ], register);

router.get("/user", verifyToken , getUser);

router.get("/profile/:id", verifyToken, getUserById);

router.post("/reset-password", [
    check("email").isEmail(),
    check("oldPassword").not().isEmpty(),
    check("newPassword").isLength({ min: 8 })
] ,verifyToken, reset_password);

router.put("/update-profile", [
    check("biography").optional().isString(),
    check("currentWorkingPlace").optional().isString(),
    check("socialLinks").optional().isObject()
  ], verifyToken, updateProfile);

router.get("/verified-users", verifyToken, getVerifiedUsers)

router.get("/recommend-users", verifyToken, recommendUsers)

router.post("/forgot-password", [
    check("email", "Please include a valid email").isEmail()
], forgotPassword);

router.post("/check-email", checkEmail);

router.post('/upload-profile-photo', verifyToken, (req, res, next) => {
  upload.single('profilePhoto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      //A Multer error occurred when uploading
      return res.status(400).json({ message: 'File upload error', details: err.message });
    } else if (err) {
      //An unknown error occurred when uploading
      return res.status(400).json({ message: err.message });
    }
    //If file type is invalid, set a custom error
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }
    next();
  });
}, uploadProfilePhoto);

// router.get('/profile-photo', verifyToken, getProfilePhoto); currently not imported, import if needed to use

router.get('/profile-photo/:id', verifyToken, getProfilePhotoById);

module.exports = router;
