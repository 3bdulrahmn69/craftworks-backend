import { Request, Response } from 'express';
import { UserService, UserServiceError } from '../services/user.service.js';
import { JobService } from '../services/job.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { ValidationHelper } from '../utils/validation.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { JobStatus } from '../types/job.types.js';
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
      req: IAuthenticatedRequest & { file?: Express.Multer.File },
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const updateData = req.body;
        const profileFile = req.file;

        // Handle profile picture upload
        if (profileFile) {
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
            const result = await uploadToCloudinary(profileFile.buffer);
            updateData.profilePicture = result.secure_url;
          } catch (err) {
            ApiResponse.internalError(res, 'Failed to upload profile image');
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
   * Add portfolio images for craftsmen
   */
  static addPortfolioImages = asyncHandler(
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

        const uploadedFiles = (req as any).files; // Cast to handle multer files

        if (!uploadedFiles || uploadedFiles.length === 0) {
          ApiResponse.badRequest(res, 'No portfolio images provided');
          return;
        }

        const user = await UserService.addPortfolioImages(
          userId,
          uploadedFiles,
          req.ip
        );

        ApiResponse.success(res, user, 'Portfolio images added successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to add portfolio images');
      }
    }
  );

  /**
   * Delete a specific portfolio image for craftsmen
   */
  static deletePortfolioImage = asyncHandler(
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

        const { imageUrl } = req.body;

        if (!imageUrl) {
          ApiResponse.badRequest(res, 'Image URL is required');
          return;
        }

        const user = await UserService.deletePortfolioImage(
          userId,
          imageUrl,
          req.ip
        );

        ApiResponse.success(res, user, 'Portfolio image deleted successfully');
      } catch (error) {
        if (error instanceof UserServiceError)
          if (error.statusCode === 404)
            ApiResponse.notFound(res, error.message);
          else if (error.statusCode === 403)
            ApiResponse.forbidden(res, error.message);
          else ApiResponse.badRequest(res, error.message);
        else ApiResponse.internalError(res, 'Failed to delete portfolio image');
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
      req: IAuthenticatedRequest & { files?: any },
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const verificationData = req.body;
        const files = req.files?.verificationDocs || [];

        // Validate that files are uploaded
        if (!files || files.length === 0) {
          ApiResponse.badRequest(
            res,
            'At least one verification document file is required'
          );
          return;
        }

        // Validate input
        const validation =
          ValidationHelper.validateVerificationSubmission(verificationData);
        if (!validation.isValid) {
          ApiResponse.badRequest(res, validation.errors.join(', '));
          return;
        }

        // Parse document names and types from form data
        const docNames = verificationData.docNames
          ? Array.isArray(verificationData.docNames)
            ? verificationData.docNames
            : [verificationData.docNames]
          : [];
        const docTypes = verificationData.docTypes
          ? Array.isArray(verificationData.docTypes)
            ? verificationData.docTypes
            : [verificationData.docTypes]
          : [];

        // Validate that we have the same number of files, names, and types
        if (
          docNames.length !== files.length ||
          docTypes.length !== files.length
        ) {
          ApiResponse.badRequest(
            res,
            'Number of files, document names, and document types must match'
          );
          return;
        }

        // Upload files to Cloudinary and prepare verification docs
        const verificationDocs = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const docName = docNames[i] || `Document ${i + 1}`;
          const docType = docTypes[i] || 'General';

          try {
            // Import streamifier only if needed
            const streamifier = await import('streamifier');

            // Wrap upload_stream in a Promise
            const uploadToCloudinary = (fileBuffer: Buffer) =>
              new Promise<{ secure_url: string }>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  {
                    // Cloudinary upload options
                    folder: 'verification-documents',
                    public_id: `${userId}_${docType}_${Date.now()}`,
                    resource_type: 'auto', // auto-detect file type
                    format:
                      file.mimetype === 'application/pdf' ? 'pdf' : 'webp',
                    overwrite: true,
                    transformation: file.mimetype.startsWith('image/')
                      ? [
                          {
                            width: 1200,
                            height: 1200,
                            crop: 'limit',
                          },
                          { quality: 'auto' },
                        ]
                      : undefined,
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

            const result = await uploadToCloudinary(file.buffer);

            verificationDocs.push({
              docType: docType,
              docUrl: result.secure_url,
              docName: docName,
            });
          } catch (err) {
            ApiResponse.internalError(res, `Failed to upload ${docName}`);
            return;
          }
        }

        // Add uploaded docs to verification data
        verificationData.verificationDocs = verificationDocs;

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
        return ApiResponse.badRequest(res, 'jobId is required');

      const craftsmen = await UserService.getRecommendedCraftsmen(jobId);
      return ApiResponse.success(res, craftsmen);
    } catch (error) {
      if (error instanceof Error && error.message === 'Job not found')
        return ApiResponse.notFound(res, 'Resource not found (invalid ID)');

      return ApiResponse.badRequest(
        res,
        error instanceof Error ? error.message : 'Failed to get recommendations'
      );
    }
  }
  /**
   * Get user's jobs (Client: posted jobs, Craftsman: hired jobs)
   */
  static getUserJobs = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const statusInput = req.query.status as string | undefined;

        // Normalize and validate status if provided
        let normalizedStatus: JobStatus | undefined;
        if (statusInput) {
          const validStatuses: JobStatus[] = [
            'Posted',
            'Hired',
            'On The Way',
            'Completed',
            'Disputed',
            'Cancelled',
            'Rescheduled',
          ];

          // Case-insensitive matching
          const matchedStatus = validStatuses.find(
            (validStatus) =>
              validStatus.toLowerCase() === statusInput.toLowerCase()
          );

          if (!matchedStatus) {
            return ApiResponse.badRequest(
              res,
              `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            );
          }

          normalizedStatus = matchedStatus;
        }

        let result;
        let message;

        // Call appropriate service method based on user role
        if (userRole === 'client') {
          result = await JobService.getJobsByClient(
            userId,
            page,
            limit,
            normalizedStatus
          );
          message = 'Posted jobs retrieved successfully';
        } else if (userRole === 'craftsman') {
          result = await JobService.getJobsByCraftsman(
            userId,
            page,
            limit,
            normalizedStatus
          );
          message = 'Hired jobs retrieved successfully';
        } else {
          return ApiResponse.forbidden(res, 'Access denied');
        }

        return ApiResponse.success(
          res,
          { data: result.data, pagination: result.pagination },
          message
        );
      } catch (error) {
        return ApiResponse.error(res, 'Failed to retrieve jobs', 500);
      }
    }
  );
}
