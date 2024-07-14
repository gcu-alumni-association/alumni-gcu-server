const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin, refresh_token } = require('../middleware/verify-token');
const { login, register, reset_password, approve, pendingUsers, logout, checkAuth, getUser, updateProfile, getVerifiedUsers, forgotPassword } = require("../controllers/user-controller")

router.post("/register",[
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check('phone').not().isEmpty(),
    check('batch').not().isEmpty(),
    check('branch').not().isEmpty()
], register);

router.post("/login", [
    check("email", "Please include the registered email").isEmail(),
    check("password", "Password is required").not().isEmpty()
] ,login);

router.get("/user", verifyToken , getUser);

router.post("/logout",verifyToken , logout);

router.post("/reset-password", [
    check("email").isEmail(),
    check("oldPassword").not().isEmpty(),
    check("newPassword").isLength({ min: 8 })
] ,verifyToken, reset_password);

router.post("/approve", [
    check("email").isEmail()
] ,verifyToken, checkAdmin, approve);

router.put("/update-profile", [
    check("biography").optional().isString(),
    check("currentWorkingPlace").optional().isString(),
    check("socialLinks").optional().isObject()
  ], verifyToken, updateProfile);

router.get("/verified-users", verifyToken, getVerifiedUsers)

router.get("/pending-users",verifyToken, checkAdmin, pendingUsers );

router.post("/refresh-token", refresh_token );

router.get("/check-auth", verifyToken, checkAuth);

router.post("/forgot-password", [
    check("email", "Please include a valid email").isEmail()
], forgotPassword);

module.exports = router;
