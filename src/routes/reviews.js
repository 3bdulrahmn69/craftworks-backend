const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const reviewController = require('../controllers/reviewController');

router.post('/', auth, reviewController.createReview);
router.get('/', auth, reviewController.listReviews);
router.get('/:id', auth, reviewController.getReview);
router.put('/:id', auth, reviewController.updateReview);
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router; 