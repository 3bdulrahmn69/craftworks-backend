import { Response } from 'express';
import { ActionLogService } from '../services/actionLog.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { ActionCategory } from '../types/actionLog.types.js';

interface LogActionParams {
  req: IAuthenticatedRequest;
  action: string;
  category: ActionCategory;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Helper function to standardize action logging across controllers
 */
export class ActionLogHelper {
  /**
   * Log an action with consistent parameters
   */
  static async logAction({
    req,
    action,
    category,
    details = {},
    success,
    errorMessage,
  }: LogActionParams): Promise<void> {
    try {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action,
        category,
        details,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success,
        errorMessage,
      });
    } catch (error) {
      // Log the logging error but don't throw to avoid breaking the main flow
      console.error('Failed to log action:', error);
    }
  }

  /**
   * Wrapper for controller methods that automatically logs success/failure
   */
  static withLogging<T extends any[]>(
    action: string,
    category: ActionCategory,
    handler: (
      req: IAuthenticatedRequest,
      res: Response,
      ...args: T
    ) => Promise<void>
  ) {
    return async (
      req: IAuthenticatedRequest,
      res: Response,
      ...args: T
    ): Promise<void> => {
      try {
        await handler(req, res, ...args);

        // Log success if response was sent successfully
        if (res.headersSent)
          await ActionLogHelper.logAction({
            req,
            action,
            category,
            success: true,
          });
      } catch (error) {
        // Log failure
        await ActionLogHelper.logAction({
          req,
          action,
          category,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        // Re-throw the error to maintain original behavior
        throw error;
      }
    };
  }
}
