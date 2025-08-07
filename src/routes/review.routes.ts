import express from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All review routes require authentication
router.use(authenticateJWT);

// Create a review for a completed job
router.post('/', ReviewController.createReview);

// Get reviews for a specific user (public)
router.get('/user/:userId', ReviewController.getUserReviews);

// Get reviews for a specific job (job participants only)
router.get('/job/:jobId', ReviewController.getJobReviews);

// Check if user can review a job
router.get('/job/:jobId/can-review', ReviewController.canReviewJob);

export default router;
