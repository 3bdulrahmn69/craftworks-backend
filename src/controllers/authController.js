const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const ActivityLog = require('../models/ActivityLog');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password, role, profile_image } = req.body;
  if (!full_name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });
  const user = await User.create({ full_name, email, phone, password, role, profile_image });

  // Log activity
  await ActivityLog.create({
    user: { _id: user._id, full_name: user.full_name, role: user.role },
    action: 'register_user',
    target: 'User',
    targetId: user._id,
    details: { email, phone, role }
  });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const resUser = {
    id: user._id,
    full_name: user.full_name,
    role: user.role,
    profile_image: user.profile_image,
  };

  res.status(201).json({ token, user: resUser });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, type } = req.body;
  if (!email || !password || !type) return res.status(400).json({ message: 'Email, password, and type are required' });
  if (!['clients', 'admins'].includes(type)) return res.status(400).json({ message: 'Invalid type. Must be "clients" or "admins".' });
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

  // Role/type logic
  if (type === 'clients' && !['client', 'craftsman'].includes(user.role)) {
    return res.status(403).json({ message: 'Admins and moderators cannot log in to the website or mobile app.' });
  }
  if (type === 'admins' && !['admin', 'moderator'].includes(user.role)) {
    return res.status(403).json({ message: 'Clients and craftsmen cannot log in to the dashboard.' });
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

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
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

  // Send reset email using Resend
  const resetUrl = `https://yourfrontend.com/reset-password?token=${token}`;
  try {
    await resend.emails.send({
      from: 'no-reply@yourdomain.com',
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Hello ${user.full_name || ''},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 15 minutes.</p>`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send reset email.' });
  }

  res.json({ message: 'Password reset email sent.' });
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

module.exports = { register, login, logout, forgotPassword, resetPassword }; 