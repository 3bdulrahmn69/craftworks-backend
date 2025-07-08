const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    full_name: String,
    role: String
  },
  action: { type: String, required: true }, // e.g., 'create_user', 'delete_job', 'create_admin'
  target: { type: String }, // e.g., 'User', 'Job', 'Admin'
  targetId: { type: String }, // e.g., the ID of the affected document
  details: { type: Object }, // any extra info
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema); 