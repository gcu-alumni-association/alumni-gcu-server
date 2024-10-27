const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlumniSchema = new Schema({
  name: { type: String, required: true },
  roll_no: { type: String, required: true, unique: true },
  batch: { type: Number, required: true },
  branch: { type: String, required: true }
});

module.exports = mongoose.model('AlumniRecord', AlumniSchema);

