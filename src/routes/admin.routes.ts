import express from 'express';
// Import the (to be created) AdminController
import { AdminController } from '../controllers/admin.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin/moderator role
router.use(authenticateJWT, authorizeRoles('admin', 'moderator'));

// Get a paginated list of all users
router.get('/users', AdminController.getAllUsers);

// Create a new admin or moderator
router.post('/users/create-admin', AdminController.createAdmin);

// Ban a user account
router.patch('/users/:userId/ban', AdminController.banUser);

// Unban a user account
router.patch('/users/:userId/unban', AdminController.unbanUser);

// Get a list of pending craftsman verifications
router.get('/verifications', AdminController.getPendingVerifications);

// Approve a craftsman's verification
router.post(
  '/verifications/:verificationId/approve',
  AdminController.approveVerification
);

// Reject a craftsman's verification
router.post(
  '/verifications/:verificationId/reject',
  AdminController.rejectVerification
);

export default router;
