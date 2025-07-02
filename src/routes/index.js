const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/jobs', require('./jobs'));
router.use('/proposals', require('./proposals'));
router.use('/contracts', require('./contracts'));
router.use('/reviews', require('./reviews'));
router.use('/messages', require('./messages'));
router.use('/reports', require('./reports'));
router.use('/services', require('./services'));
router.use('/admins', require('./admins'));
router.use('/craftsman-profiles', require('./craftsmanProfiles'));
router.use('/client-profiles', require('./clientProfiles'));
// TODO: Add other entity routes here

module.exports = router; 