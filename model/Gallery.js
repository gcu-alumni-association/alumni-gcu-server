const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GallerySchema = new Schema({
  albumName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  imageFolder: { type: String },
  images: [{ type: String }]
});

module.exports = mongoose.model('Gallery', GallerySchema);