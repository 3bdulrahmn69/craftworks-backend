const CraftsmanProfile = require('../models/CraftsmanProfile');
const asyncHandler = require('express-async-handler');

// Create profile (craftsman only)
const createProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'craftsman') return res.status(403).json({ message: 'Only craftsmen can create profile' });
  const { bio, services, portfolio } = req.body;
  const profile = await CraftsmanProfile.create({
    user_id: req.user.id,
    bio,
    services,
    portfolio
  });
  res.status(201).json(profile);
});

// Get all profiles
const listProfiles = asyncHandler(async (req, res) => {
  const profiles = await CraftsmanProfile.find();
  res.json(profiles);
});

// Get own profile
const getOwnProfile = asyncHandler(async (req, res) => {
  const profile = await CraftsmanProfile.findOne({ user_id: req.user.id });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
});

// Update own profile
const updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'craftsman') return res.status(403).json({ message: 'Only craftsmen can update profile' });
  const profile = await CraftsmanProfile.findOneAndUpdate({ user_id: req.user.id }, req.body, { new: true });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
});

// Delete profile (admin only)
const deleteProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can delete profile' });
  const profile = await CraftsmanProfile.findByIdAndDelete(req.params.id);
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ message: 'Profile deleted' });
});

module.exports = { createProfile, listProfiles, getOwnProfile, updateProfile, deleteProfile }; 