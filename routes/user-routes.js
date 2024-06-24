const express = require("express");
const router = express.Router();
const { verifyToken, checkAdmin, refresh_token } = require('../middleware/verify-token');
const { login, register, reset_password, approve, pendingUsers, logout, checkAuth, getUser } = require("../controllers/user-controller")

router.post("/register", register);
router.post("/login", login);
router.get("/user", verifyToken , getUser);
router.post("/logout", logout);
router.post("/reset-password" ,verifyToken, reset_password);
router.post("/approve",verifyToken, checkAdmin, approve);
router.get("/pending-users",verifyToken, checkAdmin, pendingUsers );
router.post("/refresh-token", refresh_token )
router.get("/check-auth", verifyToken, checkAuth)


module.exports = router;