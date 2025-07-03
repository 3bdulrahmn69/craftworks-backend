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

module.exports = router; 