const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { register, reset_password, getUser, updateProfile, getVerifiedUsers, forgotPassword, checkEmail } = require("../controllers/user-controller")
const { upload, uploadImage } = require('../middleware/upload-images')

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

router.post("/forgot-password", [
    check("email", "Please include a valid email").isEmail()
], forgotPassword);

router.post("/check-email", checkEmail);

module.exports = router;
