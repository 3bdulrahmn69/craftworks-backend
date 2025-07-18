import express from 'express';
import { SendEmailController } from '../controllers/sendEmail.controller.js';

const router = express.Router();

// POST /api/send-email
router.post('/', SendEmailController.sendContactEmail);

export default router;
