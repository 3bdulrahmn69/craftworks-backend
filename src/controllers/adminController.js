const Admin = require('../models/Admin');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Create admin (admin only)
const createAdmin = asyncHandler(async (req, res) => {
  if (req.user.role_type !== 'admin') return res.status(403).json({ message: 'Only admin can create admins' });
  const { user_id, role_type } = req.body;
  const user = await User.findById(user_id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const admin = await Admin.create({ user_id, role_type });
  res.status(201).json(admin);
});

// List admins (admin only)
const listAdmins = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role_type)) return res.status(403).json({ message: 'Only admins can view' });
  const admins = await Admin.find();
  res.json(admins);
});

// Get single admin
const getAdmin = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role_type)) return res.status(403).json({ message: 'Only admins can view' });
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json(admin);
});

// Update admin (admin can update their own role_type except admin)
const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  if (admin.user_id.toString() !== req.user.id && req.user.role_type !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (admin.role_type === 'admin') {
    return res.status(403).json({ message: 'Cannot update admin' });
  }
  Object.assign(admin, req.body);
  await admin.save();
  res.json(admin);
});

// Delete admin (admin only)
const deleteAdmin = asyncHandler(async (req, res) => {
  if (req.user.role_type !== 'admin') return res.status(403).json({ message: 'Only admin can delete admins' });
  const admin = await Admin.findByIdAndDelete(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json({ message: 'Admin deleted' });
});

module.exports = { createAdmin, listAdmins, getAdmin, updateAdmin, deleteAdmin }; 