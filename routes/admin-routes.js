const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { approve, pendingUsers, rejectUser, approvedUsers } = require("../controllers/admin-controller")

router.post("/approve", [
    check("email").isEmail()
] ,verifyToken, checkAdmin, approve);

router.post("/reject-user", [
    check("email").isEmail()
] ,verifyToken, checkAdmin, rejectUser);

router.get("/pending-users",verifyToken, checkAdmin, pendingUsers );

router.get("/approved-users", verifyToken, checkAdmin, approvedUsers)

module.exports = router;
