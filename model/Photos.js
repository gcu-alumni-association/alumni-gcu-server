const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photosSchema = new Schema({
  url: {
    type: String,
    required: true
  }
  // description: {
  //   type: String,
  //   default: ''
  // },
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // }
})

module.exports = mongoose.model('Photos', photosSchema);