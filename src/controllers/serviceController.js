const Service = require('../models/Service');
const asyncHandler = require('express-async-handler');

// Create service (admin only)
const createService = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can create services' });
  const { name, icon } = req.body;
  const service = await Service.create({ name, icon });
  res.status(201).json(service);
});

// List services (all users)
const listServices = asyncHandler(async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

// Get single service
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
});

// Update service (admin only)
const updateService = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can update services' });
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
});

// Delete service (admin only)
const deleteService = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can delete services' });
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json({ message: 'Service deleted' });
});

module.exports = { createService, listServices, getService, updateService, deleteService }; 