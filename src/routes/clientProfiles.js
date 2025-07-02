const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const clientProfileController = require('../controllers/clientProfileController');

router.post('/', auth, clientProfileController.createProfile);
router.get('/', auth, clientProfileController.listProfiles);
router.get('/me', auth, clientProfileController.getOwnProfile);
router.put('/me', auth, clientProfileController.updateProfile);
router.delete('/:id', auth, clientProfileController.deleteProfile);

module.exports = router; 