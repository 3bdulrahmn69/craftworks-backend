import express from 'express';
import { ServiceController } from '../controllers/service.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// GET /api/services (public)
router.get('/', ServiceController.getAllServices);

// All below require authentication and admin/moderator role
router.use(authenticateJWT, authorizeRoles('admin', 'moderator'));

// POST /api/services (with optional image upload)
router.post('/', upload.single('image'), ServiceController.createService);

// PUT /api/services/:id (with optional image upload)
router.put('/:id', upload.single('image'), ServiceController.updateService);

// DELETE /api/services/:id
router.delete('/:id', ServiceController.deleteService);

export default router;
