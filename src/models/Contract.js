const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  craftsman_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  completed_at: { type: Date },
  reviewed: { type: Boolean, default: false },
  final_price: { type: Number, required: true }
});

module.exports = mongoose.model('Contract', contractSchema); 