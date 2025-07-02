const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const jobController = require('../controllers/jobController');

router.post('/', auth, jobController.createJob);
router.get('/', auth, jobController.listJobs);
router.get('/:id', auth, jobController.getJob);
router.put('/:id', auth, jobController.updateJob);
router.delete('/:id', auth, jobController.deleteJob);

module.exports = router; 