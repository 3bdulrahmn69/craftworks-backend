const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const craftsmanProfileController = require('../controllers/craftsmanProfileController');

router.post('/', auth, craftsmanProfileController.createProfile);
router.get('/', auth, craftsmanProfileController.listProfiles);
router.get('/me', auth, craftsmanProfileController.getOwnProfile);
router.put('/me', auth, craftsmanProfileController.updateProfile);
router.delete('/:id', auth, craftsmanProfileController.deleteProfile);

module.exports = router; 