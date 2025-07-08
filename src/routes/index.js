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
router.use('/activity-logs', require('./logs'));
// TODO: Add other entity routes here

// Catch-all 404 for non-existent API routes
router.use((req, res, next) => {
  res.status(404).json({ message: 'API route not found' });
});

module.exports = router; 