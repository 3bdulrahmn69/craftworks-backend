const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const serviceController = require('../controllers/serviceController');

router.post('/', auth, serviceController.createService);
router.get('/', auth, serviceController.listServices);
router.get('/:id', auth, serviceController.getService);
router.put('/:id', auth, serviceController.updateService);
router.delete('/:id', auth, serviceController.deleteService);

module.exports = router; 