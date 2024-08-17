const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { register, reset_password, getUser, updateProfile, getVerifiedUsers, forgotPassword } = require("../controllers/user-controller")
const { upload, uploadImage } = require('../middleware/upload-images')

router.post("/register",[
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check('phone').not().isEmpty(),
    check('batch').not().isEmpty(),
    check('branch').not().isEmpty()
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

module.exports = router;
