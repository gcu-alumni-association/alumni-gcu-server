const express = require("express");
const router = express.Router();
const { login } = require('../middleware/login');
const { register } = require('../middleware/register');
const { reset_password } = require('../middleware/reset-password');
const { approve } = require('../middleware/approve');
const { pendingUsers } = require('../middleware/pending-users');


router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", reset_password);
router.post("/approve", approve);
router.get("/pending-users", pendingUsers );


module.exports = router;