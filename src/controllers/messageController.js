const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');

// Create message (sender only)
const createMessage = asyncHandler(async (req, res) => {
  const { receiver_id, message, job_id } = req.body;
  const msg = await Message.create({
    sender_id: req.user.id,
    receiver_id,
    message,
    job_id
  });
  res.status(201).json(msg);
});

// List messages (paginated, only sender/receiver or admin)
const listMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, job_id } = req.query;
  const filter = ['admin', 'moderator'].includes(req.user.role) ? {} : { $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }] };
  if (job_id) filter.job_id = job_id;
  const messages = await Message.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ created_at: -1 });
  res.json(messages);
});

// Get single message
const getMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  if (!['admin', 'moderator'].includes(req.user.role) && msg.sender_id.toString() !== req.user.id && msg.receiver_id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(msg);
});

// Delete message (only sender or admin)
const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  if (!['admin', 'moderator'].includes(req.user.role) && msg.sender_id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await msg.deleteOne();
  res.json({ message: 'Message deleted' });
});

// Mark message as read (only receiver or admin/moderator)
const markAsRead = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  if (![msg.receiver_id.toString()].includes(req.user.id) && !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only receiver or admin/moderator can mark as read' });
  }
  msg.is_read = true;
  await msg.save();
  res.json({ message: 'Message marked as read' });
});

module.exports = { createMessage, listMessages, getMessage, deleteMessage, markAsRead }; 