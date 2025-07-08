const Admin = require('../models/Admin');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');

// Create admin (admin only)
const createAdmin = asyncHandler(async (req, res) => {
  if (req.user.role_type !== 'admin') return res.status(403).json({ message: 'Only admin can create admins' });
  const { user_id, role_type } = req.body;
  const user = await User.findById(user_id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const admin = await Admin.create({ user_id, role_type });
  // Log activity
  await ActivityLog.create({
    user: { _id: req.user.id, full_name: req.user.full_name, role: req.user.role_type },
    action: 'create_admin',
    target: 'Admin',
    targetId: admin._id,
    details: { user_id, role_type }
  });
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
  // Log activity
  await ActivityLog.create({
    user: { _id: req.user.id, full_name: req.user.full_name, role: req.user.role_type },
    action: 'delete_admin',
    target: 'Admin',
    targetId: req.params.id
  });
  res.json({ message: 'Admin deleted' });
});

// Block user (admin only)
const blockUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can block users' });
  
  const { user_id, reason } = req.body;
  if (!user_id) return res.status(400).json({ message: 'User ID is required' });
  
  const user = await User.findById(user_id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Prevent blocking admins
  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Cannot block admin users' });
  }
  
  user.blocked = true;
  user.blocked_at = new Date();
  user.blocked_reason = reason || 'No reason provided';
  await user.save();
  // Log activity
  await ActivityLog.create({
    user: { _id: req.user.id, full_name: req.user.full_name, role: req.user.role },
    action: 'block_user',
    target: 'User',
    targetId: user._id,
    details: { reason }
  });
  
  res.json({ 
    message: 'User blocked successfully',
    user: {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      blocked: user.blocked,
      blocked_at: user.blocked_at,
      blocked_reason: user.blocked_reason
    }
  });
});

// Unblock user (admin only)
const unblockUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can unblock users' });
  
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'User ID is required' });
  
  const user = await User.findById(user_id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.blocked = false;
  user.blocked_at = undefined;
  user.blocked_reason = undefined;
  await user.save();
  // Log activity
  await ActivityLog.create({
    user: { _id: req.user.id, full_name: req.user.full_name, role: req.user.role },
    action: 'unblock_user',
    target: 'User',
    targetId: user._id
  });
  
  res.json({ 
    message: 'User unblocked successfully',
    user: {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      blocked: user.blocked
    }
  });
});

// Get blocked users (admin only)
const getBlockedUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can view blocked users' });
  
  const blockedUsers = await User.find({ blocked: true }).select('-password');
  res.json(blockedUsers);
});

module.exports = { 
  createAdmin, 
  listAdmins, 
  getAdmin, 
  updateAdmin, 
  deleteAdmin,
  blockUser,
  unblockUser,
  getBlockedUsers
}; 