const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  budget: { type: Number, required: true },
  category: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  deadline: { type: Date },
  created_at: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Job', jobSchema); 