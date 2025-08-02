import { Request, Response } from 'express';
import { AuthService, AuthenticationError } from '../services/auth.service.js';
import { ActionLogService } from '../services/actionLog.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { ValidationHelper } from '../utils/validation.js';
import { IAuthRequest } from '../types/user.types.js';
import { IAuthenticatedRequest } from '../types/common.types.js';

export class AuthController {
  static register = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      const requestData: IAuthRequest = req.body;

      // Validate input
      const validation = ValidationHelper.validateRegistration(requestData);
      if (!validation.isValid) {
        ApiResponse.badRequest(res, validation.errors.join(', '));
        return;
      }

      try {
        const result = await AuthService.registerUser(requestData, req.ip);

        // Log successful registration
        await ActionLogService.logAuthAction('register', result.user.id, {
          email: result.user.email,
          userRole: result.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        ApiResponse.success(res, result, 'User registered successfully', 201);
      } catch (error) {
        // Log failed registration
        await ActionLogService.logAuthAction('register_failed', undefined, {
          email: requestData.email,
          userRole: requestData.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        if (error instanceof AuthenticationError)
          if (error.statusCode === 409)
            ApiResponse.conflict(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Registration failed');
      }
    }
  );

  static login = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      const requestData: Partial<IAuthRequest> = req.body;

      // Validate input
      const validation = ValidationHelper.validateLogin(requestData);
      if (!validation.isValid) {
        ApiResponse.badRequest(res, validation.errors.join(', '));
        return;
      }

      try {
        const result = await AuthService.authenticateUser(requestData, req.ip);

        // Log successful login
        await ActionLogService.logAuthAction('login', result.user.id, {
          email: result.user.email,
          userRole: result.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        ApiResponse.success(res, result, 'Login successful');
      } catch (error) {
        // Log failed login
        await ActionLogService.logAuthAction('login_failed', undefined, {
          email: requestData.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        if (error instanceof AuthenticationError)
          if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.unauthorized(res, error.message);
        else ApiResponse.internalError(res, 'Login failed');
      }
    }
  );

  static logout = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;

        if (userId) {
          await AuthService.logoutUser(userId);

          // Log successful logout
          await ActionLogService.logAuthAction('logout', userId, {
            userRole: req.user?.role,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        }

        ApiResponse.success(res, undefined, 'Logged out successfully');
      } catch (error) {
        // Log failed logout attempt
        if (req.user?.userId)
          await ActionLogService.logAuthAction('logout', req.user.userId, {
            userRole: req.user.role,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
          });

        if (error instanceof AuthenticationError)
          ApiResponse.internalError(res, error.message);
        else ApiResponse.internalError(res, 'Logout failed');
      }
    }
  );

  static forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      const { email } = req.body;

      const validation = ValidationHelper.validateForgotPassword({ email });
      if (!validation.isValid) {
        ApiResponse.badRequest(res, validation.errors.join(', '));
        return;
      }

      try {
        await AuthService.forgotPassword(email);
        ApiResponse.success(
          res,
          undefined,
          'If the email exists, a password reset link has been sent'
        );
      } catch (error) {
        ApiResponse.internalError(res, 'Password reset request failed');
      }
    }
  );

  static resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      const { token, newPassword } = req.body;

      const validation = ValidationHelper.validateResetPassword({
        token,
        newPassword,
      });
      if (!validation.isValid) {
        ApiResponse.badRequest(res, validation.errors.join(', '));
        return;
      }

      try {
        await AuthService.resetPassword(token, newPassword);
        ApiResponse.success(res, undefined, 'Password reset successful');
      } catch (error) {
        if (error instanceof AuthenticationError)
          ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Password reset failed');
      }
    }
  );

  static changePassword = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const validation = ValidationHelper.validateChangePassword({
        currentPassword,
        newPassword,
      });
      if (!validation.isValid) {
        ApiResponse.badRequest(res, validation.errors.join(', '));
        return;
      }

      try {
        await AuthService.changePassword(userId, currentPassword, newPassword);

        // Log successful password change
        await ActionLogService.logAuthAction('password_change', userId, {
          userRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        ApiResponse.success(res, undefined, 'Password changed successfully');
      } catch (error) {
        // Log failed password change attempt
        await ActionLogService.logAuthAction('password_change_failed', userId, {
          userRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        if (error instanceof AuthenticationError) {
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 400)
            ApiResponse.badRequest(res, error.message);
          else
            ApiResponse.unauthorized(res, error.message);
        } else {
          ApiResponse.internalError(res, 'Password change failed');
        }
      }
    }
  );
}
