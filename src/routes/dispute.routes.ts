import express from 'express';
import { DisputeController } from '../controllers/dispute.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = express.Router();

// Multer setup for evidence file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (_req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only images and documents are allowed.')
      );
    }
  },
});

// All dispute routes require authentication
router.use(authenticateJWT);

// Create a dispute for a hired job
router.post('/', upload.array('evidence', 5), DisputeController.createDispute);

// Get dispute details
router.get('/:disputeId', DisputeController.getDispute);

// Add evidence to an existing dispute
router.post(
  '/:disputeId/evidence',
  upload.array('evidence', 5),
  DisputeController.addEvidence
);

// Get current user's disputes
router.get('/', DisputeController.getUserDisputes);

// Admin routes
router.get(
  '/admin/all',
  authorizeRoles('admin', 'moderator'),
  DisputeController.getAllDisputes
);

// Resolve a dispute (admin only)
router.put(
  '/:disputeId/resolve',
  authorizeRoles('admin', 'moderator'),
  DisputeController.resolveDispute
);

export default router;
