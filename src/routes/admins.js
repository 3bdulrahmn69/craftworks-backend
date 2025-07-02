const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.post('/', auth, adminController.createAdmin);
router.get('/', auth, adminController.listAdmins);
router.get('/:id', auth, adminController.getAdmin);
router.put('/:id', auth, adminController.updateAdmin);
router.delete('/:id', auth, adminController.deleteAdmin);

module.exports = router; 