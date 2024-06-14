const express = require("express");
const router = express.Router();
// const { approve } = require('../middleware/approve');
const { login } = require('../middleware/login');
const { register } = require('../middleware/register');
const { reset_password } = require('../middleware/reset-password');
const { approve } = require('../middleware/approve')


router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", reset_password);
router.post("/approve", approve);


module.exports = router;