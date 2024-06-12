const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//building the user database schema for mongo
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }
});

module.exports = mongoose.model('User', userSchema );
