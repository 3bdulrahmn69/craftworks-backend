import { Notification } from '../models/notification.model.js';
import { Types } from 'mongoose';

export class NotificationService {
  static async sendNotification({ user, type, title, message, data }: {
    user: Types.ObjectId;
    type: string;
    title?: string;
    message?: string;
    data?: Record<string, any>;
  }) {
    const notification = new Notification({ user, type, title, message, data });
    await notification.save();
    // TODO: Integrate with real-time (WebSocket/FCM) if needed
    return notification;
  }

  static async getUserNotifications(userId: Types.ObjectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, totalItems] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: userId }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return { notifications, pagination: { page, limit, totalPages, totalItems } };
  }

  static async markNotificationsRead(userId: Types.ObjectId, notificationIds?: string[]) {
    const filter: any = { user: userId };
    if (notificationIds && notificationIds.length > 0) {
      filter._id = { $in: notificationIds };
    }
    await Notification.updateMany(filter, { read: true });
    return true;
  }
} 