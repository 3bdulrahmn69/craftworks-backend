import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { EmailService, EmailServiceError } from '../services/email.service.js';

export class SendEmailController {
  /**
   * Handle POST /api/send-email
   */
  static sendContactEmail = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, message } = req.body;
    try {
      await EmailService.sendContactEmail({ 
        name, 
        email, 
        message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      ApiResponse.success(res, undefined, 'Email sent successfully.');
    } catch (error) {
      if (error instanceof EmailServiceError) {
        if (error.statusCode === 400) {
          ApiResponse.badRequest(res, error.message);
        } else {
          ApiResponse.internalError(res, error.message);
        }
      } else {
        ApiResponse.internalError(res, 'Failed to send email.');
      }
    }
  });
} 