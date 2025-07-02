const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  craftsman_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cover_letter: { type: String },
  price_offer: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Proposal', proposalSchema); 