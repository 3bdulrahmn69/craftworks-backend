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

// GET /api/jobs/:jobId/quotes
router.get(
  '/',
  authorizeRoles('client', 'admin'),
  QuoteController.getQuotesForJob
);

// PUT /api/jobs/:jobId/quotes/:quoteId/:status (Client only)
router.put(
  '/:quoteId/:status',
  authorizeRoles('client'),
  QuoteController.updateQuoteStatus
);

export default router;
