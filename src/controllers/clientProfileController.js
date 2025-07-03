const ClientProfile = require('../models/ClientProfile');
const asyncHandler = require('express-async-handler');

// Create profile (client only)
const createProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can create profile' });
  const { rating } = req.body;
  const profile = await ClientProfile.create({
    user_id: req.user.id,
    rating
  });
  res.status(201).json(profile);
});

// Get all profiles
const listProfiles = asyncHandler(async (req, res) => {
  const profiles = await ClientProfile.find();
  res.json(profiles);
});

// Get own profile
const getOwnProfile = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ user_id: req.user.id });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
});

// Update own profile
const updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can update profile' });
  const profile = await ClientProfile.findOneAndUpdate({ user_id: req.user.id }, req.body, { new: true });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
});

// Delete profile (admin or moderator only)
const deleteProfile = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can delete profile' });
  const profile = await ClientProfile.findByIdAndDelete(req.params.id);
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ message: 'Profile deleted' });
});

module.exports = { createProfile, listProfiles, getOwnProfile, updateProfile, deleteProfile }; 