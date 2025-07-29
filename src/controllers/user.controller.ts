import { Request, Response } from 'express';
import { UserService, UserServiceError } from '../services/user.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { ValidationHelper } from '../utils/validation.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import cloudinary from '../utils/cloudinary.js';

export class UserController {
  /**
   * Get current user profile
   */
  static getCurrentUser = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const user = await UserService.getCurrentUser(userId);
        ApiResponse.success(res, user, 'User profile retrieved successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to retrieve user profile');
      }
    }
  );

  /**
   * Update current user profile
   */
  static updateCurrentUser = asyncHandler(
    async (
      req: IAuthenticatedRequest & { file?: any },
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const updateData = req.body;
        // If a file is uploaded, handle Cloudinary upload
        if (req.file) {
          // Import streamifier only if needed
          const streamifier = await import('streamifier');
          // Wrap upload_stream in a Promise
          const uploadToCloudinary = (fileBuffer: Buffer) =>
            new Promise<{ secure_url: string }>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  // Cloudinary upload options
                  folder: 'profile-images',
                  width: 400,
                  height: 400,
                  crop: 'fill',
                  resource_type: 'image',
                  format: 'webp',
                  overwrite: true,
                  transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto' },
                  ],
                },
                (error, result) => {
                  if (error || !result)
                    return reject(
                      error || new Error('No result from Cloudinary')
                    );
                  resolve(result as { secure_url: string });
                }
              );
              streamifier.default.createReadStream(fileBuffer).pipe(stream);
            });

          try {
            const result = await uploadToCloudinary(req.file.buffer);
            updateData.profilePicture = result.secure_url;
          } catch (err) {
            ApiResponse.internalError(res, 'Failed to upload image');
            return;
          }
        }

        // Validate input
        const validation = ValidationHelper.validateUserUpdate(updateData);
        if (!validation.isValid) {
          ApiResponse.badRequest(res, validation.errors.join(', '));
          return;
        }

        const user = await UserService.updateCurrentUser(
          userId,
          updateData,
          req.ip
        );

        ApiResponse.success(res, user, 'Profile updated successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else if (error.statusCode === 409)
            ApiResponse.conflict(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to update profile');
      }
    }
  );

  /**
   * Delete current user's profile picture
   */
  static deleteProfilePicture = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const user = await UserService.deleteProfilePicture(userId, req.ip);

        ApiResponse.success(res, user, 'Profile picture deleted successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to delete profile picture');
      }
    }
  );

  /**
   * Get public profile of a specific user
   */
  static getPublicProfile = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      try {
        const { userId } = req.params;

        if (!userId) {
          ApiResponse.badRequest(res, 'User ID is required');
          return;
        }

        // Validate ObjectId format
        if (!ValidationHelper.isValidObjectId(userId)) {
          ApiResponse.notFound(res, 'Resource not found (invalid ID)');
          return;
        }

        const user = await UserService.getPublicProfile(userId);
        ApiResponse.success(res, user, 'User profile retrieved successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to retrieve user profile');
      }
    }
  );

  /**
   * Submit verification documents (Craftsman only)
   */
  static submitVerification = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const verificationData = req.body;

        // Validate input
        const validation =
          ValidationHelper.validateVerificationSubmission(verificationData);
        if (!validation.isValid) {
          ApiResponse.badRequest(res, validation.errors.join(', '));
          return;
        }

        const user = await UserService.submitVerification(
          userId,
          verificationData,
          req.ip
        );

        ApiResponse.success(
          res,
          user,
          'Verification documents submitted successfully',
          201
        );
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to submit verification');
      }
    }
  );

  /**
   * Update craftsman service
   */
  static updateCraftsmanService = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const { serviceId } = req.body;

        // Validate input
        if (serviceId && typeof serviceId !== 'string') {
          ApiResponse.badRequest(res, 'serviceId must be a string');
          return;
        }

        const user = await UserService.updateCraftsmanService(
          userId,
          serviceId,
          req.ip
        );

        ApiResponse.success(res, user, 'Service updated successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to update service');
      }
    }
  );

  static async getRecommendations(req: IAuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.query;
      if (!jobId || typeof jobId !== 'string')
        return res.status(400).json({ message: 'jobId is required' });

      const craftsmen = await UserService.getRecommendedCraftsmen(jobId);
      return res.json({ data: craftsmen });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get recommendations',
      });
    }
  }
}
