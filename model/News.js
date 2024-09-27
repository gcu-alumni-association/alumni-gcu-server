const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  images: {
    type: [String],  // Array of strings to store image paths
    default: []
},
imageFolder: {
    type: String  // To store the name of the folder containing the images
},
});

module.exports = mongoose.model('News', newsSchema);
