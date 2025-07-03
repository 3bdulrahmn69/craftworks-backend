const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
  subcategories: [{ type: String }],
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Service', serviceSchema); 