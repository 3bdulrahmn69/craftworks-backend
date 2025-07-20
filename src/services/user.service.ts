import { User } from '../models/user.model.js';
import { IUser, IUserPublic } from '../types/user.types.js';
import { ActionLogService } from './actionLog.service.js';
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
    if (!user) 
      throw new UserServiceError('User not found', 404);
    

    if (user.isBanned) 
      throw new UserServiceError('Account is banned', 403);
    

    return this.sanitizeUserData(user);
  }

  /**
   * Update current user profile
   */
  static async updateCurrentUser(
    userId: string,
    updateData: Partial<IUser>,
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) 
      throw new UserServiceError('User not found', 404);
    

    if (user.isBanned) 
      throw new UserServiceError('Account is banned', 403);
    

    // Validate email if being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) 
        throw new UserServiceError('Email already exists', 409);
      
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
      'profilePicture ',
      'address',
      'craftsmanInfo',
    ];

    for (const field of allowedFields) 
      if (updateData[field as keyof IUser] !== undefined) 
        (user as any)[field] = updateData[field as keyof IUser];
      
    

    // Update user logs
    if (userIP) 
      user.userLogs.lastIP = userIP;
    

    await user.save();

    // Log the update
    await ActionLogService.logAction({
      userId,
      action: 'profile_updated',
      category: 'user_management',
      details: {
        updatedFields: Object.keys(updateData),
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('profile_updated', userId, {
      updatedFields: Object.keys(updateData),
    });

    return this.sanitizeUserData(user);
  }

  /**
   * Get public profile of a specific user
   */
  static async getPublicProfile(userId: string): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) 
      throw new UserServiceError('User not found', 404);
    

    if (user.isBanned) 
      throw new UserServiceError('User not found', 404); // Don't reveal banned status
    

    return this.sanitizeUserData(user);
  }

  /**
   * Submit verification documents (Craftsman only)
   */
  static async submitVerification(
    userId: string,
    verificationData: {
      skills: string[];
      bio?: string;
      portfolioImageUrls?: string[];
      verificationDocs: Array<{
        docType: string;
        docUrl: string;
      }>;
    },
    userIP?: string
  ): Promise<IUserPublic> {
    const user = await User.findById(userId);
    if (!user) 
      throw new UserServiceError('User not found', 404);
    

    if (user.isBanned) 
      throw new UserServiceError('Account is banned', 403);
    

    if (user.role !== 'craftsman') 
      throw new UserServiceError('Only craftsmen can submit verification', 403);
    

    // Validate skills
    if (!verificationData.skills || verificationData.skills.length === 0) 
      throw new UserServiceError('At least one skill is required', 400);
    

    // Validate verification documents
    if (
      !verificationData.verificationDocs ||
      verificationData.verificationDocs.length === 0
    ) 
      throw new UserServiceError(
        'At least one verification document is required',
        400
      );
    

    // Update craftsman info
    user.craftsmanInfo = {
      skills: verificationData.skills,
      bio: verificationData.bio || '',
      portfolioImageUrls: verificationData.portfolioImageUrls || [],
      verificationStatus: 'pending',
      verificationDocs: verificationData.verificationDocs,
    };

    // Update user logs
    if (userIP) 
      user.userLogs.lastIP = userIP;
    

    await user.save();

    // Log the verification submission
    await ActionLogService.logAction({
      userId,
      action: 'verification_submitted',
      category: 'user_management',
      details: {
        skillsCount: verificationData.skills.length,
        docsCount: verificationData.verificationDocs.length,
      },
      ipAddress: userIP,
      success: true,
    });

    loggerHelpers.logUserAction('verification_submitted', userId, {
      skillsCount: verificationData.skills.length,
      docsCount: verificationData.verificationDocs.length,
    });

    return this.sanitizeUserData(user);
  }

  static async getRecommendedCraftsmen(jobId: string) {
    // Get the job
    const { Job } = await import('../models/job.model.js');
    const job = await Job.findById(jobId).lean();
    if (!job) 
      throw new Error('Job not found');
    
    // Find craftsmen with matching skills/category
    const craftsmen = await (
      await import('../models/user.model.js')
    ).User.find({
      role: 'craftsman',
      'craftsmanInfo.skills': job.category,
      'craftsmanInfo.verificationStatus': 'verified',
      isBanned: false,
    })
      .select('fullName profilePicture rating rating_count craftsmanInfo')
      .lean();
    return craftsmen;
  }

  /**
   * Sanitize user data for public response
   */
  private static sanitizeUserData(user: IUser): IUserPublic {
    return {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      rating: user.rating,
      rating_count: user.rating_count,
    };
  }
}
