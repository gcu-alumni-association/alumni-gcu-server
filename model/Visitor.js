const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const Visitor = mongoose.model("Visitor", VisitorSchema);
module.exports = Visitor;
