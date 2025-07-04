const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

const register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password, role, profile_image } = req.body;
  if (!full_name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });
  const user = await User.create({ full_name, email, phone, password, role, profile_image });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const resUser = {
    id: user._id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    profile_image: user.profile_image,
  };

  res.status(201).json({ token, user: resUser });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  
  // Check if user is blocked
  if (user.blocked) {
    return res.status(403).json({ 
      message: 'Account has been blocked', 
      blocked_at: user.blocked_at,
      blocked_reason: user.blocked_reason 
    });
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const resUser = {
    id: user._id,
    full_name: user.full_name,
    role: user.role,
    profile_image: user.profile_image,
  };

  res.json({ token, user: resUser });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
  await user.save();
  // In production, send email with token. For now, return it.
  res.json({ message: 'Password reset token generated', token });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password has been reset' });
});

module.exports = { register, login, forgotPassword, resetPassword }; 