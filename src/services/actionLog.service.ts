import { ActionLog } from '../models/actionLog.model.js';
import {
  IActionLog,
  IActionLogQuery,
  IActionLogResponse,
  ActionCategory,
  ILogFilter,
} from '../types/actionLog.types.js';
import { User } from '../models/user.model.js';
import logger from './logger.js';

export class ActionLogService {
  /**
   * Create a new action log entry
   */
  static async logAction(logData: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    action: string;
    category: ActionCategory;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    success: boolean;
    errorMessage?: string;
    sessionId?: string;
  }): Promise<IActionLog> {
    try {
      const actionLog = new ActionLog({
        ...logData,
        timestamp: new Date(),
      });

      await actionLog.save();

      // Also log to Winston for file-based logging
      logger.info('Action logged', {
        logId: actionLog._id,
        action: logData.action,
        category: logData.category,
        userId: logData.userId,
        success: logData.success,
      });

      return actionLog;
    } catch (error) {
      logger.error('Failed to create action log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logData,
      });
      throw error;
    }
  }

  /**
   * Log user authentication actions
   */
  static async logAuthAction(
    action:
      | 'login'
      | 'logout'
      | 'register'
      | 'login_failed'
      | 'register_failed',
    userId?: string,
    details?: {
      email?: string;
      phone?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
      sessionId?: string;
    }
  ): Promise<IActionLog> {
    const success = !action.includes('_failed');

    // Get user info if userId is provided
    let userInfo: { email?: string; fullName?: string; role?: string } = {};
    if (userId)
      try {
        const user = await User.findById(userId).select('email fullName role');
        if (user)
          userInfo = {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          };
      } catch (error) {
        logger.warn('Failed to fetch user info for action log', {
          userId,
          error,
        });
      }

    return this.logAction({
      userId,
      userEmail: userInfo.email || details?.email,
      userName: userInfo.fullName,
      userRole: userInfo.role || details?.userRole,
      action,
      category: 'auth',
      details: {
        email: details?.email,
        phone: details?.phone,
        loginMethod: details?.email ? 'email' : 'phone',
      },
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      success,
      errorMessage: details?.errorMessage,
      sessionId: details?.sessionId,
    });
  }

  /**
   * Get action logs with filtering and pagination
   */
  static async getActionLogs(
    query: IActionLogQuery
  ): Promise<IActionLogResponse> {
    try {
      const {
        userId,
        userEmail,
        action,
        category,
        success,
        startDate,
        endDate,
        ipAddress,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = query;

      // Build filter object
      const filter: any = {};

      if (userId) filter.userId = userId;

      if (userEmail) filter.userEmail = { $regex: userEmail, $options: 'i' };

      if (action) filter.action = { $regex: action, $options: 'i' };

      if (category) filter.category = category;

      if (typeof success === 'boolean') filter.success = success;

      if (ipAddress) filter.ipAddress = ipAddress;

      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = startDate;

        if (endDate) filter.timestamp.$lte = endDate;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute queries
      const [logs, totalCount] = await Promise.all([
        ActionLog.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        ActionLog.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        logs: logs as IActionLog[],
        totalCount,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Failed to fetch action logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  /**
   * Get action logs with advanced filtering
   */
  static async getFilteredLogs(
    filters: ILogFilter,
    page = 1,
    limit = 50
  ): Promise<IActionLogResponse> {
    try {
      const filter: any = {};

      // Category filter
      if (filters.category && filters.category.length > 0)
        filter.category = { $in: filters.category };

      // Actions filter
      if (filters.actions && filters.actions.length > 0)
        filter.action = { $in: filters.actions };

      // Success filter
      if (typeof filters.success === 'boolean')
        filter.success = filters.success;

      // User roles filter
      if (filters.userRoles && filters.userRoles.length > 0)
        filter.userRole = { $in: filters.userRoles };

      // Date range filter
      if (filters.dateRange)
        filter.timestamp = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };

      // Search filter (searches in action, userEmail, userName)
      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: 'i' };
        filter.$or = [
          { action: searchRegex },
          { userEmail: searchRegex },
          { userName: searchRegex },
        ];
      }

      return this.getActionLogs({
        ...filter,
        page,
        limit,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      });
    } catch (error) {
      logger.error('Failed to fetch filtered logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
      });
      throw error;
    }
  }

  /**
   * Get action statistics
   */
  static async getActionStats(dateRange?: { start: Date; end: Date }) {
    try {
      const matchStage: any = {};

      if (dateRange)
        matchStage.timestamp = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };

      const stats = await ActionLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] },
            },
            categoryCounts: {
              $push: '$category',
            },
            actionCounts: {
              $push: '$action',
            },
          },
        },
        {
          $project: {
            totalActions: 1,
            successfulActions: 1,
            failedActions: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulActions', '$totalActions'] },
                100,
              ],
            },
            categoryCounts: 1,
            actionCounts: 1,
          },
        },
      ]);

      // Get category breakdown
      const categoryStats = await ActionLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Get top actions
      const topActions = await ActionLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return {
        overview: stats[0] || {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          successRate: 0,
        },
        categoryBreakdown: categoryStats,
        topActions,
      };
    } catch (error) {
      logger.error('Failed to fetch action stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Delete old logs (cleanup utility)
   */
  static async cleanupOldLogs(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await ActionLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info('Action logs cleanup completed', {
        deletedCount: result.deletedCount,
        cutoffDate,
      });

      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to cleanup old logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        olderThanDays,
      });
      throw error;
    }
  }
}
