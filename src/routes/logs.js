const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');

// Only admin can access
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can view activity logs' });
  }
  const { limit = 100, skip = 0 } = req.query;
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
  res.json(logs);
});

module.exports = router; 