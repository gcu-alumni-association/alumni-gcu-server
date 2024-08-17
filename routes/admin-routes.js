const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { approve, pendingUsers, rejectUser } = require("../controllers/admin-controller")
const { upload, uploadImage } = require('../middleware/upload-images')


router.post("/approve", [
    check("email").isEmail()
] ,verifyToken, checkAdmin, approve);

router.post("/reject-user", [
    check("email").isEmail()
] ,verifyToken, checkAdmin, rejectUser);

router.get("/pending-users",verifyToken, checkAdmin, pendingUsers );

router.post("/upload", verifyToken, checkAdmin, upload.single('image'), uploadImage);

module.exports = router;
