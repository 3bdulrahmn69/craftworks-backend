import { User } from '../models/user.model.js';
import {
  IUser,
  IUserPublic,
  ICraftsmanRecommendation,
} from '../types/user.types.js';
import { ActionLogService } from './actionLog.service.js';
import { UserTransformHelper } from '../utils/userTransformHelper.js';
import { loggerHelpers } from './logger.js';

export class UserServiceError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class UserService {
  /**
   * Get current user profile
   */
  static async getCurrentUser(userId: string): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    return await this.sanitizeUserData(user);
  }

  /**
   * Update current user profile
   */
  static async updateCurrentUser(
    userId: string,
    updateData: Partial<IUser> & {
      serviceId?: string;
      portfolioImageFiles?: Express.Multer.File[];
      portfolioAction?: 'add' | 'replace' | 'remove';
      existingPortfolioImages?: string[];
    },
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    // Validate email if being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) throw new UserServiceError('Email already exists', 409);
    }

    // Validate phone if being updated
    if (updateData.phone && updateData.phone !== user.phone) {
      const existingUser = await User.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });
      if (existingUser)
        throw new UserServiceError('Phone number already exists', 409);
    }

    // Update allowed fields
    const allowedFields = [
      'fullName',
      'email',
      'phone',
      'profilePicture',
      'address',
      'craftsmanInfo',
    ];

    for (const field of allowedFields)
      if (updateData[field as keyof IUser] !== undefined)
        (user as any)[field] = updateData[field as keyof IUser];

    // Handle service update for craftsmen
    if (updateData.serviceId && user.role === 'craftsman') {
      // Validate service ID (basic ObjectId format validation)
      if (!/^[0-9a-fA-F]{24}$/.test(updateData.serviceId))
        throw new UserServiceError(
          `Invalid service ID: ${updateData.serviceId}`,
          400
        );

      // Update service in craftsmanInfo
      if (!user.craftsmanInfo)
        user.craftsmanInfo = {
          service: updateData.serviceId,
          bio: '',
          portfolioImageUrls: [],
          verificationStatus: 'pending',
          verificationDocs: [],
        };
      else user.craftsmanInfo.service = updateData.serviceId;
    }

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the update
    await ActionLogService.logAction({
      userId,
      action: 'profile_updated',
      category: 'user_management',
      details: {
        updatedFields: Object.keys(updateData).filter(
          (key) =>
            ![
              'portfolioImageFiles',
              'portfolioAction',
              'existingPortfolioImages',
            ].includes(key)
        ),
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('profile_updated', userId, {
      updatedFields: Object.keys(updateData).filter(
        (key) =>
          ![
            'portfolioImageFiles',
            'portfolioAction',
            'existingPortfolioImages',
          ].includes(key)
      ),
    });

    return await this.sanitizeUserData(user);
  }

  /**
   * Get public profile of a specific user
   */
  static async getPublicProfile(userId: string): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('User not found', 404); // Don't reveal banned status

    return await this.sanitizeUserData(user);
  }

  /**
   * Submit verification documents (Craftsman only)
   */
  static async submitVerification(
    userId: string,
    verificationData: {
      service?: string;
      portfolioImageUrls?: string[];
      verificationDocs: Array<{
        docType: string;
        docUrl: string;
        docName?: string;
      }>;
    },
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    if (user.role !== 'craftsman')
      throw new UserServiceError('Only craftsmen can submit verification', 403);

    // Validate verification documents
    if (
      !verificationData.verificationDocs ||
      verificationData.verificationDocs.length === 0
    )
      throw new UserServiceError(
        'At least one verification document is required',
        400
      );

    // Update craftsman info - preserve existing bio
    const existingCraftsmanInfo = user.craftsmanInfo;
    user.craftsmanInfo = {
      service: verificationData.service || existingCraftsmanInfo?.service || '',
      bio: existingCraftsmanInfo?.bio || '', // Preserve existing bio
      portfolioImageUrls: verificationData.portfolioImageUrls || [],
      verificationStatus: 'pending',
      verificationDocs: verificationData.verificationDocs,
    };

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the verification submission
    await ActionLogService.logAction({
      userId,
      action: 'verification_submitted',
      category: 'user_management',
      details: {
        docsCount: verificationData.verificationDocs.length,
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('verification_submitted', userId, {
      docsCount: verificationData.verificationDocs.length,
    });

    return await this.sanitizeUserData(user);
  }

  /**
   * Update craftsman service
   */
  static async updateCraftsmanService(
    userId: string,
    serviceId: string,
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    if (user.role !== 'craftsman')
      throw new UserServiceError('Only craftsmen can update service', 403);

    // Validate service ID (basic ObjectId format validation)
    if (serviceId && !/^[0-9a-fA-F]{24}$/.test(serviceId))
      throw new UserServiceError(`Invalid service ID: ${serviceId}`, 400);

    // Update service
    if (!user.craftsmanInfo)
      user.craftsmanInfo = {
        service: serviceId,
        bio: '',
        portfolioImageUrls: [],
        verificationStatus: 'pending',
        verificationDocs: [],
      };
    else user.craftsmanInfo.service = serviceId;

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the service update
    await ActionLogService.logAction({
      userId,
      action: 'service_updated',
      category: 'user_management',
      details: {
        serviceId,
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('service_updated', userId, {
      serviceId,
    });

    return await this.sanitizeUserData(user);
  }

  /**
   * Delete user's profile picture
   */
  static async deleteProfilePicture(
    userId: string,
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    // Clear profile picture
    user.profilePicture = undefined;

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the profile picture deletion
    await ActionLogService.logAction({
      userId,
      action: 'profile_picture_deleted',
      category: 'user_management',
      details: {},
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('profile_picture_deleted', userId, {});

    return await this.sanitizeUserData(user);
  }

  /**
   * Add portfolio images for craftsmen (simplified version)
   */
  static async addPortfolioImages(
    userId: string,
    uploadedFiles: any[],
    userIP?: string
  ): Promise<IUserPublic> {
    return this.updatePortfolioImages(userId, 'add', [], uploadedFiles, userIP);
  }

  /**
   * Update portfolio images for craftsmen
   */
  static async updatePortfolioImages(
    userId: string,
    action: 'add' | 'replace' | 'remove',
    existingImages: string[] = [],
    uploadedFiles?: any[],
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    if (user.role !== 'craftsman')
      throw new UserServiceError(
        'Only craftsmen can manage portfolio images',
        403
      );

    // Initialize craftsman info if missing
    if (!user.craftsmanInfo) {
      user.craftsmanInfo = {
        service: undefined,
        bio: '',
        portfolioImageUrls: [],
        verificationStatus: 'none',
        verificationDocs: [],
      };
    }

    let newImageUrls: string[] = [];

    // Upload new images to Cloudinary if provided
    if (uploadedFiles && uploadedFiles.length > 0) {
      const cloudinary = (await import('../utils/cloudinary.js')).default;
      const streamifier = await import('streamifier');

      const uploadPromises = uploadedFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'portfolio-images',
                resource_type: 'image',
                format: 'webp',
                transformation: [
                  { width: 800, height: 600, crop: 'fill' },
                  { quality: 'auto:good' },
                ],
              },
              (error, result) => {
                if (error || !result) {
                  return reject(
                    error || new Error('No result from Cloudinary')
                  );
                }
                resolve(result.secure_url);
              }
            );
            streamifier.default.createReadStream(file.buffer).pipe(stream);
          })
      );

      try {
        newImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        throw new UserServiceError(
          'Failed to upload images to Cloudinary',
          500
        );
      }
    }

    // Update portfolio images based on action
    switch (action) {
      case 'add':
        // Add new images to existing ones (max 10 images)
        const combinedImages = [
          ...user.craftsmanInfo.portfolioImageUrls,
          ...newImageUrls,
        ];
        if (combinedImages.length > 10) {
          throw new UserServiceError(
            'Maximum 10 portfolio images allowed',
            400
          );
        }
        user.craftsmanInfo.portfolioImageUrls = combinedImages;
        break;

      case 'replace':
        // Replace all images with new ones (if provided) or with existing images
        user.craftsmanInfo.portfolioImageUrls =
          newImageUrls.length > 0 ? newImageUrls : existingImages;
        break;

      case 'remove':
        // Keep only the existing images (remove others)
        user.craftsmanInfo.portfolioImageUrls = existingImages;
        break;

      default:
        throw new UserServiceError(
          'Invalid action. Use: add, replace, or remove',
          400
        );
    }

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the portfolio update
    await ActionLogService.logAction({
      userId,
      action: 'portfolio_updated',
      category: 'content',
      details: {
        action,
        imageCount: user.craftsmanInfo.portfolioImageUrls.length,
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('portfolio_updated', userId, {
      action,
      imageCount: user.craftsmanInfo.portfolioImageUrls.length,
    });

    return await this.sanitizeUserData(user);
  }

  /**
   * Delete a specific portfolio image
   */
  static async deletePortfolioImage(
    userId: string,
    imageUrl: string,
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError('User not found', 404);

    if (user.isBanned) throw new UserServiceError('Account is banned', 403);

    if (user.role !== 'craftsman')
      throw new UserServiceError(
        'Only craftsmen can manage portfolio images',
        403
      );

    if (!user.craftsmanInfo || !user.craftsmanInfo.portfolioImageUrls) {
      throw new UserServiceError('No portfolio images found', 404);
    }

    // Find and remove the specific image
    const initialLength = user.craftsmanInfo.portfolioImageUrls.length;
    user.craftsmanInfo.portfolioImageUrls =
      user.craftsmanInfo.portfolioImageUrls.filter((url) => url !== imageUrl);

    if (user.craftsmanInfo.portfolioImageUrls.length === initialLength) {
      throw new UserServiceError('Portfolio image not found', 404);
    }

    // Update user logs
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Log the portfolio image deletion
    await ActionLogService.logAction({
      userId,
      action: 'portfolio_image_deleted',
      category: 'content',
      details: { deletedImage: imageUrl },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('portfolio_image_deleted', userId, {
      deletedImage: imageUrl,
    });

    return await this.sanitizeUserData(user);
  }

  static async getRecommendedCraftsmen(
    jobId: string
  ): Promise<ICraftsmanRecommendation[]> {
    // Import mongoose for ObjectId validation
    const { Types } = await import('mongoose');

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(jobId)) throw new Error('Job not found');

    // Get the job
    const { Job } = await import('../models/job.model.js');
    const job = await Job.findById(jobId)
      .populate({
        path: 'service',
        select: 'name icon description', // Exclude createdAt and updatedAt
      })
      .lean();
    if (!job) throw new Error('Job not found');

    // Extract the service ID from the job
    const serviceId = (job.service as any)?._id || job.service;
    if (!serviceId) throw new Error('Service not found for this job');

    // Find craftsmen with matching service
    const craftsmen = await (
      await import('../models/user.model.js')
    ).User.find({
      role: 'craftsman',
      'craftsmanInfo.service': serviceId.toString(),
      'craftsmanInfo.verificationStatus': 'verified',
      isBanned: false,
    })
      .select('fullName profilePicture rating ratingCount craftsmanInfo')
      .lean();

    // Get all invitations for this job to check invitation status
    const { Invitation } = await import('../models/invitation.model.js');
    const invitations = await Invitation.find({ job: jobId })
      .select('craftsman status')
      .lean();

    // Create a map of craftsman ID to invitation status for quick lookup
    const invitationMap = new Map();
    invitations.forEach((invitation) => {
      invitationMap.set(invitation.craftsman.toString(), true);
    });

    // Manually populate service data and add isInvited field for each craftsman
    const { Service } = await import('../models/service.model.js');
    const populatedCraftsmen = await Promise.all(
      craftsmen.map(async (craftsman) => {
        const isInvited = invitationMap.has(craftsman._id.toString());

        if (craftsman.craftsmanInfo?.service)
          try {
            const service = await Service.findById(
              craftsman.craftsmanInfo.service
            )
              .select('name icon description')
              .lean();

            if (service) (craftsman.craftsmanInfo.service as any) = service;
          } catch (error) {
            // If service lookup fails, keep the original ID
            console.error(
              `Failed to populate service for craftsman ${craftsman._id}:`,
              error
            );
          }

        // Return craftsman data with isInvited field
        return {
          ...craftsman,
          isInvited,
        };
      })
    );

    return populatedCraftsmen;
  }
  /**
   * Sanitize user data for public response
   */
  private static async sanitizeUserData(user: IUser): Promise<IUserPublic> {
    return await UserTransformHelper.toPublic(user);
  }
}
