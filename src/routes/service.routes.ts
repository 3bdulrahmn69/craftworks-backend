import express from 'express';
import { ServiceController } from '../controllers/service.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/services (public)
router.get('/', ServiceController.getAllServices);

// All below require authentication and admin/moderator role
router.use(authenticateJWT, authorizeRoles('admin', 'moderator'));

// POST /api/services
router.post('/', ServiceController.createService);

// PUT /api/services/:id
router.put('/:id', ServiceController.updateService);

// DELETE /api/services/:id
router.delete('/:id', ServiceController.deleteService);

export default router; 