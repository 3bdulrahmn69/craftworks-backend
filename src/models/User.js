const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'moderator', 'client', 'craftsman'], required: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  country: { type: String, default: 'Egypt', immutable: true },
  profile_image: { type: String },
  password: { type: String, required: true, select: false },
  created_at: { type: Date, default: Date.now, index: true },
  rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpires: { type: Date }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 