import { Response } from 'express';
import { ActionLogService } from '../services/actionLog.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { AdminService } from '../services/admin.service.js';

export const AdminController = {
  // GET /api/admin/users
  async getAllUsers(req: IAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { users, pagination } = await AdminService.getAllUsers(page, limit);
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'list_users',
        category: 'user_management',
        details: { page, limit },
        ipAddress: req.ip,
        success: true,
      });
      res.json({ data: users, pagination });
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
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  },

  // POST /api/admin/users/create-admin
  async createAdmin(req: IAuthenticatedRequest, res: Response) {
    try {
      const { email, password, fullName, role, phone } = req.body;
      const newUser = await AdminService.createAdmin({ email, password, fullName, role, phone });
      await ActionLogService.logAction({
        userId: req.user?.userId,
        userRole: req.user?.role,
        action: 'create_admin',
        category: 'user_management',
        details: { createdUserId: newUser._id, role },
        ipAddress: req.ip,
        success: true,
      });
      res.status(201).json({ message: 'Admin user created', user: newUser });
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
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create admin user' });
    }
  },

  // PATCH /api/admin/users/:userId/ban
  async banUser(req: IAuthenticatedRequest, res: Response) {
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
      res.json({ message: 'User banned successfully' });
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
      res.status(404).json({ message: error instanceof Error ? error.message : 'Failed to ban user' });
    }
  },

  // PATCH /api/admin/users/:userId/unban
  async unbanUser(req: IAuthenticatedRequest, res: Response) {
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
      res.json({ message: 'User unbanned successfully' });
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
      res.status(404).json({ message: error instanceof Error ? error.message : 'Failed to unban user' });
    }
  },

  // GET /api/admin/verifications
  async getPendingVerifications(req: IAuthenticatedRequest, res: Response) {
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
      res.json({ data: pending });
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
      res.status(500).json({ message: 'Failed to fetch pending verifications' });
    }
  },

  // POST /api/admin/verifications/:verificationId/approve
  async approveVerification(req: IAuthenticatedRequest, res: Response) {
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
      res.json({ message: 'Verification approved' });
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
      res.status(404).json({ message: error instanceof Error ? error.message : 'Failed to approve verification' });
    }
  },

  // POST /api/admin/verifications/:verificationId/reject
  async rejectVerification(req: IAuthenticatedRequest, res: Response) {
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
      res.json({ message: 'Verification rejected' });
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
      res.status(404).json({ message: error instanceof Error ? error.message : 'Failed to reject verification' });
    }
  },
}; 