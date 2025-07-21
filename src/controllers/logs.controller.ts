import { Response } from 'express';
import { ActionLogService } from '../services/actionLog.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import {
  IActionLogQuery,
  ILogFilter,
  ActionCategory,
} from '../types/actionLog.types.js';
import { ValidationHelper } from '../utils/validation.js';

export class LogsController {
  /**
   * Get all action logs with pagination and filtering
   * Only accessible by admin users
   */
  static getLogs = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      // Extract query parameters
      const {
        userId,
        userEmail,
        action,
        category,
        success,
        startDate,
        endDate,
        ipAddress,
        page = '1',
        limit = '50',
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      // Validate and parse parameters
      const query: IActionLogQuery = {
        page: Math.max(1, parseInt(page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit as string) || 50)),
        sortBy: sortBy as string,
        sortOrder: (sortOrder as string) === 'asc' ? 'asc' : 'desc',
      };

      // Add optional filters
      if (userId) query.userId = userId as string;
      if (userEmail) query.userEmail = userEmail as string;
      if (action) query.action = action as string;
      if (category) query.category = category as ActionCategory;
      if (success !== undefined)
        query.success = success === 'true' || success === '1';
      if (ipAddress) query.ipAddress = ipAddress as string;

      // Parse dates
      if (startDate) {
        const dateValidation = ValidationHelper.validateDateRange(startDate);
        if (!dateValidation.isValid) {
          ApiResponse.badRequest(res, dateValidation.errors.join(', '));
          return;
        }
        const parsed = new Date(startDate as string);
        if (!isNaN(parsed.getTime())) query.startDate = parsed;
      }
      if (endDate) {
        const dateValidation = ValidationHelper.validateDateRange(
          undefined,
          endDate
        );
        if (!dateValidation.isValid) {
          ApiResponse.badRequest(res, dateValidation.errors.join(', '));
          return;
        }
        const parsed = new Date(endDate as string);
        if (!isNaN(parsed.getTime())) query.endDate = parsed;
      }

      try {
        const result = await ActionLogService.getActionLogs(query);

        // Log the admin's access to logs
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_logs',
          category: 'system',
          details: {
            query: req.query,
            resultCount: result.logs.length,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });

        ApiResponse.success(res, result, 'Logs retrieved successfully');
      } catch (error) {
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_logs_failed',
          category: 'system',
          details: { query: req.query },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        ApiResponse.internalError(res, 'Failed to retrieve logs');
      }
    }
  );

  /**
   * Get logs with advanced filtering
   */
  static getFilteredLogs = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      const {
        categories,
        actions,
        success,
        userRoles,
        startDate,
        endDate,
        search,
        page = '1',
        limit = '50',
      } = req.body;

      // Build filter object
      const filters: ILogFilter = {};

      if (categories && Array.isArray(categories))
        filters.category = categories as ActionCategory[];
      if (actions && Array.isArray(actions)) filters.actions = actions;
      if (typeof success === 'boolean') filters.success = success;
      if (userRoles && Array.isArray(userRoles)) filters.userRoles = userRoles;
      if (search) filters.search = search;

      // Validate filters
      const filterValidation = ValidationHelper.validateLogFilters({
        categories,
        actions,
        userRoles,
        success,
        search,
      });
      if (!filterValidation.isValid) {
        ApiResponse.badRequest(res, filterValidation.errors.join(', '));
        return;
      }

      // Parse date range
      if (startDate && endDate) {
        const dateValidation = ValidationHelper.validateDateRange(
          startDate,
          endDate
        );
        if (!dateValidation.isValid) {
          ApiResponse.badRequest(res, dateValidation.errors.join(', '));
          return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()))
          filters.dateRange = { start, end };
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      try {
        const result = await ActionLogService.getFilteredLogs(
          filters,
          pageNum,
          limitNum
        );

        // Log the admin's filtered access
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_filtered_logs',
          category: 'system',
          details: {
            filters,
            resultCount: result.logs.length,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });

        ApiResponse.success(
          res,
          result,
          'Filtered logs retrieved successfully'
        );
      } catch (error) {
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_filtered_logs_failed',
          category: 'system',
          details: { filters },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        ApiResponse.internalError(res, 'Failed to retrieve filtered logs');
      }
    }
  );

  /**
   * Get action logs statistics
   */
  static getLogsStats = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      const { startDate, endDate } = req.query;

      let dateRange: { start: Date; end: Date } | undefined;

      if (startDate && endDate) {
        const dateValidation = ValidationHelper.validateDateRange(
          startDate,
          endDate
        );
        if (!dateValidation.isValid) {
          ApiResponse.badRequest(res, dateValidation.errors.join(', '));
          return;
        }
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()))
          dateRange = { start, end };
      }

      try {
        const stats = await ActionLogService.getActionStats(dateRange);

        // Log the admin's stats access
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_logs_stats',
          category: 'system',
          details: { dateRange },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });

        ApiResponse.success(
          res,
          stats,
          'Log statistics retrieved successfully'
        );
      } catch (error) {
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'view_logs_stats_failed',
          category: 'system',
          details: { dateRange },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        ApiResponse.internalError(res, 'Failed to retrieve log statistics');
      }
    }
  );

  /**
   * Get available filter options
   */
  static getFilterOptions = asyncHandler(
    async (
      _req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        // Get unique values for filters
        const [categories, actions, userRoles] = await Promise.all([
          ActionLogService.getActionLogs({ limit: 1000 }).then((result) => [
            ...new Set(result.logs.map((log) => log.category)),
          ]),
          ActionLogService.getActionLogs({ limit: 1000 }).then((result) => [
            ...new Set(result.logs.map((log) => log.action)),
          ]),
          ActionLogService.getActionLogs({ limit: 1000 }).then((result) => [
            ...new Set(result.logs.map((log) => log.userRole).filter(Boolean)),
          ]),
        ]);

        const filterOptions = {
          categories,
          actions,
          userRoles,
          successOptions: [true, false],
        };

        ApiResponse.success(
          res,
          filterOptions,
          'Filter options retrieved successfully'
        );
      } catch (error) {
        ApiResponse.internalError(res, 'Failed to retrieve filter options');
      }
    }
  );

  /**
   * Clean up old logs (admin only)
   */
  static cleanupLogs = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      const { olderThanDays = 365 } = req.body;

      try {
        const deletedCount = await ActionLogService.cleanupOldLogs(
          olderThanDays
        );

        // Log the cleanup action
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'cleanup_logs',
          category: 'system',
          details: {
            olderThanDays,
            deletedCount,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });

        ApiResponse.success(
          res,
          { deletedCount },
          `Successfully cleaned up ${deletedCount} old log entries`
        );
      } catch (error) {
        await ActionLogService.logAction({
          userId: req.user?.userId,
          userRole: req.user?.role,
          action: 'cleanup_logs_failed',
          category: 'system',
          details: { olderThanDays },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        ApiResponse.internalError(res, 'Failed to cleanup logs');
      }
    }
  );
}
