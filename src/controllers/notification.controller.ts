import { Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';

export const NotificationController = {
  // GET /api/notifications
  async getUserNotifications(req: IAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { notifications, pagination } = await NotificationService.getUserNotifications(new Types.ObjectId(userId), page, limit);
      return res.json({ data: notifications, pagination });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  },

  // POST /api/notifications/mark-read
  async markNotificationsRead(req: IAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const { notificationIds } = req.body;
      await NotificationService.markNotificationsRead(new Types.ObjectId(userId), notificationIds);
      return res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      return res.status(400).json({ message: 'Failed to mark notifications as read' });
    }
  },
}; 