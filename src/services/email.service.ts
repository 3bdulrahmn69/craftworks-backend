import { Resend } from 'resend';
import { ValidationHelper } from '../utils/validation.js';
import { ActionLogService } from './actionLog.service.js';

export class EmailServiceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class EmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  /**
   * Send a contact email from the website contact form
   */
  static async sendContactEmail({
    name,
    email,
    message,
    ipAddress,
    userAgent,
  }: {
    name: string;
    email: string;
    message: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    if (!name || !email || !message) {
      // Log failed attempt
      await ActionLogService.logAction({
        action: 'email_send_failed',
        category: 'communication',
        details: {
          email,
          name,
          message: message,
          reason: 'Missing required fields',
        },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Name, email, and message are required.',
      });
      throw new EmailServiceError(
        'Name, email, and message are required.',
        400
      );
    }
    if (!ValidationHelper.validateEmail(email)) {
      // Log failed attempt
      await ActionLogService.logAction({
        action: 'email_send_failed',
        category: 'communication',
        details: {
          email,
          name,
          message: message,
          reason: 'Invalid email format',
        },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid email format.',
      });
      throw new EmailServiceError('Invalid email format.', 400);
    }
    try {
      await this.resend.emails.send({
        from: 'craftworkssite@resend.dev',
        to: process.env.SUPPORT_EMAIL || 'craftworkssite@gmail.com',
        subject: `Contact Form Submission from ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br>${message}</p>`,
      });

      // Log successful email send
      await ActionLogService.logAction({
        action: 'email_sent',
        category: 'communication',
        details: {
          email,
          name,
          message: message,
          messageLength: message.length,
          recipient: process.env.SUPPORT_EMAIL || 'craftworkssite@gmail.com',
        },
        ipAddress,
        userAgent,
        success: true,
      });
    } catch (err) {
      // Log failed email send
      await ActionLogService.logAction({
        action: 'email_send_failed',
        category: 'communication',
        details: {
          email,
          name,
          reason: 'Resend API error',
        },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw new EmailServiceError('Failed to send email.', 500);
    }
  }
}
