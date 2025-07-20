import express from 'express';
import { JobController } from '../controllers/job.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import quoteRoutes from './quote.routes.js';
import invitationRoutes from './invitation.routes.js';

const router = express.Router();

// All job routes require authentication
router.use(authenticateJWT);

// POST /api/jobs (Client only)
router.post('/', authorizeRoles('client'), JobController.createJob);

// GET /api/jobs (All authenticated users)
router.get('/', JobController.getJobs);

// GET /api/jobs/:jobId (All authenticated users)
router.get('/:jobId', JobController.getJobById);

// PUT /api/jobs/:jobId (Client only, must own job)
router.put('/:jobId', authorizeRoles('client'), JobController.updateJob);

// DELETE /api/jobs/:jobId (Client only, must own job)
router.delete('/:jobId', authorizeRoles('client'), JobController.deleteJob);

// PATCH /api/jobs/:jobId/status (All authenticated users)
router.patch('/:jobId/status', JobController.updateJobStatus);

// Mount quote routes
router.use('/:jobId/quotes', quoteRoutes);
// Mount invitation routes
router.use('/:jobId/invitations', invitationRoutes);
// Mount /invite as a direct POST route
router.post(
  '/:jobId/invite',
  authenticateJWT,
  authorizeRoles('client'),
  invitationRoutes
);

export default router;
