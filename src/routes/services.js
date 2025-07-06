const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const serviceController = require('../controllers/serviceController');

// Admin/Moderator routes
router.post('/', auth, serviceController.createService);
router.get('/', serviceController.listServices);

// Public category routes (no auth required) - MUST come before /:id
router.get('/categories', serviceController.getCategories);
router.get('/categories/:category/craftsmen', serviceController.getCraftsmenByCategory);

// Craftsman service management routes - MUST come before /:id
router.get('/craftsman/services', auth, serviceController.getCraftsmanServices);
router.put('/craftsman/services', auth, serviceController.updateCraftsmanServices);

// File upload placeholder - MUST come before /:id
router.post('/uploads', auth, async (req, res) => {
  // Placeholder: In production, handle file upload and return URL
  res.json({ url: 'https://example.com/fake-uploaded-image.jpg' });
});

// Parameterized routes - MUST come last
router.get('/:id', serviceController.getService);
router.put('/:id', auth, serviceController.updateService);
router.delete('/:id', auth, serviceController.deleteService);

module.exports = router; 