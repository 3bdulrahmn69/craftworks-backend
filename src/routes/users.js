const express = require('express');
const router = express.Router();
const { auth, permit } = require('../middlewares/auth');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Get all users (admin only)
router.get('/', auth, permit('admin', 'moderator'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
}));

// Get own profile
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
}));

// Update own profile
router.put('/me', auth, asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.password;
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json(user);
}));

// Delete user (admin only)
router.delete('/:id', auth, permit('admin', 'moderator'), asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
}));

// Get public user profile
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -resetPasswordTokenHash -resetPasswordExpires');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const isSelfOrAdmin = req.user.id === user.id || ['admin', 'moderator'].includes(req.user.role);
  const publicFields = {
    _id: user._id,
    role: user.role,
    full_name: user.full_name,
    country: user.country,
    profile_image: user.profile_image,
    rating: user.rating,
    rating_count: user.rating_count,
    created_at: user.created_at
  };
  if (isSelfOrAdmin) {
    publicFields.email = user.email;
    publicFields.phone = user.phone;
  }
  res.json(publicFields);
}));

module.exports = router; 