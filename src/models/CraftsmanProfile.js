const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  image: { type: String, required: true },
  description: { type: String },
  date: { type: Date }
}, { _id: false });

const craftsmanProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  bio: { type: String },
  services: [{ type: String }],
  portfolio: [portfolioSchema],
  rating: { type: Number, default: 0 }
});

module.exports = mongoose.model('CraftsmanProfile', craftsmanProfileSchema); 