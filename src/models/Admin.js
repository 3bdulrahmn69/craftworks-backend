const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  role_type: { type: String, enum: ['admin', 'moderator'], required: true }
});

module.exports = mongoose.model('Admin', adminSchema); 