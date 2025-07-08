const ActivityLog = require('../models/ActivityLog');

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  // Log activity
  await ActivityLog.create({
    user: { _id: req.user.id, full_name: req.user.full_name, role: req.user.role },
    action: 'delete_user',
    target: 'User',
    targetId: req.params.id
  });
  res.json({ message: 'User deleted' });
}); 