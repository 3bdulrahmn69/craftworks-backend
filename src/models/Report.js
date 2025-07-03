const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
  created_at: { type: Date, default: Date.now, index: true },
  report_type: { type: String, enum: ['user', 'job', 'message'], default: 'user' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
});

module.exports = mongoose.model('Report', reportSchema); 