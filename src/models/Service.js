const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }
});

module.exports = mongoose.model('Service', serviceSchema); 