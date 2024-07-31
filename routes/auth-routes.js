const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { login, refresh_token, logout} = require("../controllers/auth-controller");
const { verifyToken } = require("../middleware/verify-token")


router.post("/login", [
    check("email", "Please include the registered email").isEmail(),
    check("password", "Password is required").not().isEmpty()
] ,login);

router.post("/refresh-token", refresh_token );

router.post("/logout",verifyToken , logout);

module.exports = router;