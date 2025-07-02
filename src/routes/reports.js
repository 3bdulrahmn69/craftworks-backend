const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

router.post('/', auth, reportController.createReport);
router.get('/', auth, reportController.listReports);
router.get('/:id', auth, reportController.getReport);
router.delete('/:id', auth, reportController.deleteReport);

module.exports = router; 