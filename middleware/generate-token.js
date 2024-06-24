const express= require("express");
const jwt = require('jsonwebtoken');


const generateToken = (user, secret, expiresIn ) => {
    return jwt.sign({ id:user._id, role: user.role }, secret , { expiresIn })
};

// exports.generateToken = generateToken;
module.exports = generateToken;