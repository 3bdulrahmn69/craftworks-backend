import { Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';

export class NotificationController {
  // GET /api/notifications
  static async getUserNotifications(req: IAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { notifications, pagination } =
        await NotificationService.getUserNotifications(
          new Types.ObjectId(userId),
          page,
          limit
        );
      return ApiResponse.success(
        res,
        { data: notifications, pagination },
        'Notifications retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch notifications', 500);
    }
  }

  // POST /api/notifications/mark-read
  static async markNotificationsRead(
    req: IAuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const { notificationIds } = req.body;
      await NotificationService.markNotificationsRead(
        new Types.ObjectId(userId),
        notificationIds
      );
      return ApiResponse.success(
        res,
        null,
        'Notifications marked as read successfully'
      );
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        'Failed to mark notifications as read'
      );
    }
  }
}
