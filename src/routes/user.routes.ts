import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { QuoteController } from '../controllers/quote.controller.js';
import { InvitationController } from '../controllers/invitation.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import multer from 'multer';
import uploadVerification from '../config/multerVerification.js';

const router = express.Router();

// Multer setup for profile image upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/))
      return cb(
        new Error('Only image files are allowed (jpg, png, gif, webp)')
      );

    cb(null, true);
  },
});

// All user routes require authentication
router.use(authenticateJWT);

// Get current user profile
router.get('/me', UserController.getCurrentUser);

// Update current user profile (with optional profile image upload)
router.put(
  '/me',
  upload.single('profilePicture'),
  UserController.updateCurrentUser
);

// Delete current user's profile picture
router.delete('/me/profile-picture', UserController.deleteProfilePicture);

// Portfolio image management for craftsmen
router.put(
  '/me/portfolio',
  authorizeRoles('craftsman'),
  upload.array('portfolioImages', 10), // Allow up to 10 images
  UserController.addPortfolioImages
);

router.delete(
  '/me/portfolio',
  authorizeRoles('craftsman'),
  UserController.deletePortfolioImage
);

// Get recommended craftsmen for a job (Client only)
router.get(
  '/recommendations',
  authorizeRoles('client'),
  UserController.getRecommendations
);

// Get public profile of a specific user
router.get('/:userId', UserController.getPublicProfile);

// Submit verification documents (Craftsman only)
router.post(
  '/craftsman/verification',
  authorizeRoles('craftsman'),
  uploadVerification.fields([{ name: 'verificationDocs', maxCount: 10 }]),
  UserController.submitVerification
);

// Update craftsman service (Craftsman only)
router.put(
  '/craftsman/service',
  authorizeRoles('craftsman'),
  UserController.updateCraftsmanService
);

// Get user's jobs (Client: posted jobs, Craftsman: hired jobs)
router.get(
  '/me/jobs',
  authorizeRoles('client', 'craftsman'),
  UserController.getUserJobs
);

// Get craftsman's submitted quotes (Craftsman only)
router.get(
  '/me/quotes',
  authorizeRoles('craftsman'),
  QuoteController.getCraftsmanQuotes
);

// Get craftsman's received invitations (Craftsman only)
router.get(
  '/me/invitations',
  authorizeRoles('craftsman'),
  InvitationController.getCraftsmanInvitations
);

export default router;
