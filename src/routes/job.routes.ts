import express from 'express';
import { JobController } from '../controllers/job.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import quoteRoutes from './quote.routes.js';
import invitationRoutes from './invitation.routes.js';
import multer from 'multer';

const router = express.Router();

// Multer setup for job image uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Maximum 5 files
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/))
      return cb(
        new Error('Only image files are allowed (jpg, png, gif, webp)')
      );
    cb(null, true);
  },
});

// All job routes require authentication
router.use(authenticateJWT);

// POST /api/jobs (Client only) - with image upload support
router.post(
  '/',
  authorizeRoles('client'),
  upload.array('photos', 5),
  JobController.createJob
);

// GET /api/jobs (All authenticated users)
router.get('/', JobController.getJobs);

// GET /api/jobs/search (All authenticated users)
router.get('/search', JobController.searchJobs);

// GET /api/jobs/:jobId (All authenticated users)
router.get('/:jobId', JobController.getJobById);

// PUT /api/jobs/:jobId (Client only, must own job)
router.put('/:jobId', authorizeRoles('client'), JobController.updateJob);

// DELETE /api/jobs/:jobId (Client only, must own job)
router.delete('/:jobId', authorizeRoles('client'), JobController.deleteJob);

// PATCH /api/jobs/:jobId/status (All authenticated users)
router.patch('/:jobId/status', JobController.updateJobStatus);

// PATCH /api/jobs/:jobId/date (Client only)
router.patch(
  '/:jobId/date',
  authorizeRoles('client'),
  JobController.updateJobDate
);

// Mount quote routes
router.use('/:jobId/quotes', quoteRoutes);
// Mount invitation routes
router.use('/:jobId', invitationRoutes);

export default router;
