const Service = require('../models/Service');
const CraftsmanProfile = require('../models/CraftsmanProfile');
const asyncHandler = require('express-async-handler');

// Create service (admin only)
const createService = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can create services' });
  const { name, icon, description, subcategories, is_active } = req.body;
  const service = await Service.create({ name, icon, description, subcategories, is_active });
  res.status(201).json(service);
});

// List services (all users)
const listServices = asyncHandler(async (req, res) => {
  const { active_only } = req.query;
  let query = {};
  
  if (active_only === 'true') {
    query.is_active = true;
  }
  
  const services = await Service.find(query);
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

// Get all categories (for craftsmen to choose from)
const getCategories = asyncHandler(async (req, res) => {
  const services = await Service.find({ is_active: true });
  const categories = services.map(service => ({
    id: service._id,
    name: service.name,
    icon: service.icon,
    description: service.description,
    subcategories: service.subcategories
  }));
  res.json(categories);
});

// Get craftsmen by category
const getCraftsmenByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const craftsmen = await CraftsmanProfile.find({
    services: category
  })
  .populate('user_id', 'full_name email profile_image rating rating_count')
  .skip(skip)
  .limit(parseInt(limit));
  
  const total = await CraftsmanProfile.countDocuments({ services: category });
  
  res.json({
    data: craftsmen,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      totalItems: total
    }
  });
});

// Update craftsman services (craftsman only)
const updateCraftsmanServices = asyncHandler(async (req, res) => {
  if (req.user.role !== 'craftsman') {
    return res.status(403).json({ message: 'Only craftsmen can update their services' });
  }
  
  const { services } = req.body;
  
  // Validate that all services exist and are active
  const validServices = await Service.find({
    _id: { $in: services },
    is_active: true
  });
  
  if (validServices.length !== services.length) {
    return res.status(400).json({ message: 'Some selected services are invalid or inactive' });
  }
  
  let profile = await CraftsmanProfile.findOne({ user_id: req.user.id });
  
  if (!profile) {
    profile = await CraftsmanProfile.create({
      user_id: req.user.id,
      services: services
    });
  } else {
    profile.services = services;
    await profile.save();
  }
  
  res.json({
    message: 'Services updated successfully',
    profile: {
      id: profile._id,
      user_id: profile.user_id,
      services: profile.services,
      bio: profile.bio
    }
  });
});

// Get craftsman's selected services
const getCraftsmanServices = asyncHandler(async (req, res) => {
  if (req.user.role !== 'craftsman') {
    return res.status(403).json({ message: 'Only craftsmen can view their services' });
  }
  
  const profile = await CraftsmanProfile.findOne({ user_id: req.user.id });
  
  if (!profile) {
    return res.json({ services: [] });
  }
  
  // Get full service details
  const services = await Service.find({
    _id: { $in: profile.services },
    is_active: true
  });
  
  res.json({ services });
});

module.exports = { 
  createService, 
  listServices, 
  getService, 
  updateService, 
  deleteService,
  getCategories,
  getCraftsmenByCategory,
  updateCraftsmanServices,
  getCraftsmanServices
}; 