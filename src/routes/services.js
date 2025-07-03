const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const serviceController = require('../controllers/serviceController');

router.post('/', auth, serviceController.createService);
router.get('/', auth, serviceController.listServices);
router.get('/:id', auth, serviceController.getService);
router.put('/:id', auth, serviceController.updateService);
router.delete('/:id', auth, serviceController.deleteService);
router.get('/categories', auth, async (req, res) => {
  const services = await require('../models/Service').find();
  const categories = services.map(s => s.name);
  res.json(categories);
});
router.post('/uploads', auth, async (req, res) => {
  // Placeholder: In production, handle file upload and return URL
  res.json({ url: 'https://example.com/fake-uploaded-image.jpg' });
});

module.exports = router; 