const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  rating: { type: Number }
});

module.exports = mongoose.model('ClientProfile', clientProfileSchema); 