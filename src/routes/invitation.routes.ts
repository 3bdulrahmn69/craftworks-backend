import express from 'express';
import { InvitationController } from '../controllers/invitation.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router({ mergeParams: true });

// All invitation routes require authentication
router.use(authenticateJWT);

// POST /api/jobs/:jobId/invite (Client only)
router.post(
  '/invite',
  authorizeRoles('client'),
  InvitationController.inviteCraftsman
);

// GET /api/jobs/:jobId/invitations (Client only)
router.get(
  '/',
  authorizeRoles('client'),
  InvitationController.getInvitationsForJob
);

// POST /api/jobs/:jobId/invitations/respond (Craftsman only)
router.post(
  '/respond',
  authorizeRoles('craftsman'),
  InvitationController.respondToInvitation
);

export default router;
