import express from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateJWT);

// GET /api/notifications
router.get('/', NotificationController.getUserNotifications);

// POST /api/notifications/mark-read
router.post('/mark-read', NotificationController.markNotificationsRead);

export default router;
