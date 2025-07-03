const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
  created_at: { type: Date, default: Date.now, index: true },
  is_read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema); 