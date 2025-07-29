import { Response } from 'express';
import { ActionLogService } from '../services/actionLog.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { AdminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AdminController {
  // GET /api/admin/users
  static async getAllUsers(req: IAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data: users, pagination } = await AdminService.getAllUsers(
        page,
        limit
      );
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'list_users',
        category: 'user_management',
        details: { page, limit },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(
        res,
        { data: users, pagination },
        'Users retrieved successfully'
      );
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'list_users',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return ApiResponse.error(res, 'Failed to fetch users', 500);
    }
  }

  // POST /api/admin/users/create-admin
  static async createAdmin(req: IAuthenticatedRequest, res: Response) {
    try {
      const { email, password, fullName, role, phone } = req.body;
      const newUser = await AdminService.createAdmin({
        email,
        password,
        fullName,
        role,
        phone,
      });
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'create_admin',
        category: 'user_management',
        details: { createdUserId: newUser._id, role },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(res, newUser, 'Admin user created', 201);
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'create_admin',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error ? error.message : 'Failed to create admin user';
      return ApiResponse.error(res, message, 400);
    }
  }

  // PATCH /api/admin/users/:userId/ban
  static async banUser(req: IAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      await AdminService.banUser(userId);
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'ban_user',
        category: 'user_management',
        details: { bannedUserId: userId },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(res, null, 'User banned successfully');
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'ban_user',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error ? error.message : 'Failed to ban user';
      return ApiResponse.error(res, message, 404);
    }
  }

  // PATCH /api/admin/users/:userId/unban
  static async unbanUser(req: IAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      await AdminService.unbanUser(userId);
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'unban_user',
        category: 'user_management',
        details: { unbannedUserId: userId },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(res, null, 'User unbanned successfully');
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'unban_user',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error ? error.message : 'Failed to unban user';
      return ApiResponse.error(res, message, 404);
    }
  }

  // GET /api/admin/verifications
  static async getPendingVerifications(
    req: IAuthenticatedRequest,
    res: Response
  ) {
    try {
      const pending = await AdminService.getPendingVerifications();
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'list_pending_verifications',
        category: 'user_management',
        details: { count: pending.length },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(
        res,
        pending,
        'Pending verifications retrieved successfully'
      );
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'list_pending_verifications',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return ApiResponse.error(
        res,
        'Failed to fetch pending verifications',
        500
      );
    }
  }

  // POST /api/admin/verifications/:verificationId/approve
  static async approveVerification(req: IAuthenticatedRequest, res: Response) {
    try {
      const { verificationId } = req.params;
      await AdminService.approveVerification(verificationId);
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'approve_verification',
        category: 'user_management',
        details: { craftsmanId: verificationId },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(res, null, 'Verification approved');
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'approve_verification',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to approve verification';
      return ApiResponse.error(res, message, 404);
    }
  }

  // POST /api/admin/verifications/:verificationId/reject
  static async rejectVerification(req: IAuthenticatedRequest, res: Response) {
    try {
      const { verificationId } = req.params;
      await AdminService.rejectVerification(verificationId);
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'reject_verification',
        category: 'user_management',
        details: { craftsmanId: verificationId },
        ipAddress: req.ip,
        success: true,
      });
      return ApiResponse.success(res, null, 'Verification rejected');
    } catch (error) {
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'reject_verification',
        category: 'user_management',
        details: {},
        ipAddress: req.ip,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reject verification';
      return ApiResponse.error(res, message, 404);
    }
  }
}
