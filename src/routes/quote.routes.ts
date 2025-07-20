import express from 'express';
import { QuoteController } from '../controllers/quote.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router({ mergeParams: true });

// All quote routes require authentication
router.use(authenticateJWT);

// POST /api/jobs/:jobId/quotes (Craftsman only)
router.post('/', authorizeRoles('craftsman'), QuoteController.submitQuote);

// GET /api/jobs/:jobId/quotes (Client only)
router.get('/', authorizeRoles('client'), QuoteController.getQuotesForJob);

// POST /api/jobs/:jobId/quotes/:quoteId/accept (Client only)
router.post(
  '/:quoteId/accept',
  authorizeRoles('client'),
  QuoteController.acceptQuote
);

export default router;
