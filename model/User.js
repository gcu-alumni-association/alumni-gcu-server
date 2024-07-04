const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

  phone: { 
    type: String, 
    required: true 
  },

  password: { 
    type: String 
  },

  batch: {
    type: String,
    required: true
  },

  branch: {
    type: String,
    required: true
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },

  role: {
    type: String, 
    default: 'user'   
  }

});

module.exports = mongoose.model('User', userSchema);
