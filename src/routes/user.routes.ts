import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = express.Router();

// Multer setup for profile image upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
    cb(null, true);
  },
});

// All user routes require authentication
router.use(authenticateJWT);

// Get current user profile
router.get('/me', UserController.getCurrentUser);

// Update current user profile (with optional profile image upload)
router.put('/me', upload.single('profilePicture'), UserController.updateCurrentUser);

// Get public profile of a specific user
router.get('/:userId', UserController.getPublicProfile);

// Submit verification documents (Craftsman only)
router.post('/craftsman/verification', authorizeRoles('craftsman'), UserController.submitVerification);

// Get recommended craftsmen for a job (Client only)
router.get('/recommendations', authorizeRoles('client'), UserController.getRecommendations);

export default router; 