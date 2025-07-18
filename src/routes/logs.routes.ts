import express from 'express';
import { LogsController } from '../controllers/logs.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// All logs routes require authentication and admin role only (not even moderator)
router.use(authenticateJWT);
router.use(authorizeRoles('admin'));

// Routes for action logs
router.get('/', LogsController.getLogs);
router.post('/filter', LogsController.getFilteredLogs);
router.get('/stats', LogsController.getLogsStats);
router.get('/filter-options', LogsController.getFilterOptions);
router.post('/cleanup', LogsController.cleanupLogs);

export default router;
