import { Types } from 'mongoose';
import { Review } from '../models/review.model.js';
import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import { ValidationHelper } from '../utils/validation.js';
import { IReviewCreate, IReviewPublic } from '../types/review.types.js';
import { ActionLogService } from './actionLog.service.js';
import { NotificationService } from './notification.service.js';

export class ReviewServiceError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ReviewServiceError';
  }
}

export class ReviewService {
  /**
   * Create a new review for a completed job
   */
  static async createReview(
    userId: string,
    reviewData: IReviewCreate,
    userIP?: string
  ): Promise<IReviewPublic> {
    // Find the job and validate it
    const job = await Job.findById(reviewData.jobId)
      .populate('client', 'fullName profilePicture role')
      .populate('craftsman', 'fullName profilePicture role');

    if (!job) {
      throw new ReviewServiceError('Job not found', 404);
    }

    // Check if job is completed
    if (job.status !== 'Completed') {
      throw new ReviewServiceError('Can only review completed jobs', 400);
    }

    // Check if user is part of this job
    const isClient = job.client._id.toString() === userId;
    const isCraftsman =
      job.craftsman && job.craftsman._id.toString() === userId;

    if (!isClient && !isCraftsman) {
      throw new ReviewServiceError(
        'You are not authorized to review this job',
        403
      );
    }

    // Determine reviewer and reviewee
    const reviewer = new Types.ObjectId(userId);
    const reviewee = isClient ? job.craftsman!._id : job.client._id;

    if (!job.craftsman) {
      throw new ReviewServiceError('Job has no assigned craftsman', 400);
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      job: job._id,
      reviewer: reviewer,
    });

    if (existingReview) {
      throw new ReviewServiceError('You have already reviewed this job', 400);
    }

    // Check if counterpart has already reviewed
    const counterpartReview = await Review.findOne({
      job: job._id,
      reviewer: reviewee,
    });

    const counterpartReviewed = !!counterpartReview;

    // Create the review
    const review = new Review({
      job: job._id,
      reviewer,
      reviewee,
      rating: reviewData.rating,
      comment: reviewData.comment?.trim(),
      isVisible: counterpartReviewed, // Visible if counterpart already reviewed
      counterpartReviewed,
    });

    await review.save();

    // If counterpart already reviewed, make both reviews visible
    if (counterpartReviewed) {
      await Review.updateOne(
        { job: job._id, reviewer: reviewee },
        {
          isVisible: true,
          counterpartReviewed: true,
        }
      );
    }

    // Update user ratings
    await this.updateUserRating(reviewee.toString());

    // Log the action
    await ActionLogService.logAction({
      userId,
      action: 'review_created',
      category: 'content',
      details: {
        jobId: job._id.toString(),
        revieweeId: reviewee.toString(),
        rating: reviewData.rating,
      },
      ipAddress: userIP,
      success: true,
    });

    // Send notification to the reviewee
    await NotificationService.sendNotification({
      user: reviewee,
      type: 'review',
      title: 'New Review Received',
      message: `You received a ${reviewData.rating}-star review for "${job.title}"`,
      data: {
        jobId: job._id.toString(),
        reviewId: review._id.toString(),
        rating: reviewData.rating,
      },
    });

    const reviewerUser = isClient ? job.client : job.craftsman!;
    const revieweeUser = isClient ? job.craftsman! : job.client;
    return this.transformReviewToPublic(review, reviewerUser, revieweeUser);
  }

  /**
   * Get reviews for a specific user
   */
  static async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: IReviewPublic[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    // Validate userId format
    if (!ValidationHelper.isValidObjectId(userId)) {
      throw new ReviewServiceError('Invalid user ID', 400);
    }

    // Ensure user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      throw new ReviewServiceError('User not found', 404);
    }

    const skip = (page - 1) * limit;

    // Get all reviews for the user (including not yet visible)
    const [reviews, totalItems] = await Promise.all([
      Review.find({
        reviewee: userId,
      })
        .populate('job', 'title')
        .populate('reviewer', 'fullName profilePicture role')
        .populate('reviewee', 'fullName profilePicture role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({
        reviewee: userId,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const transformedReviews = reviews.map((review) =>
      this.transformReviewToPublic(review, review.reviewer, review.reviewee)
    );

    return {
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    };
  }

  /**
   * Get reviews for a specific job
   */
  static async getJobReviews(
    jobId: string,
    requestingUserId: string
  ): Promise<IReviewPublic[]> {
    // Find the job to validate access
    const job = await Job.findById(jobId);
    if (!job) {
      throw new ReviewServiceError('Job not found', 404);
    }

    // Check if requesting user is part of this job
    const isClient = job.client.toString() === requestingUserId;
    const isCraftsman =
      job.craftsman && job.craftsman.toString() === requestingUserId;

    if (!isClient && !isCraftsman) {
      throw new ReviewServiceError(
        'You are not authorized to view these reviews',
        403
      );
    }

    // Get all reviews for this job (both visible and hidden for job participants)
    const reviews = await Review.find({ job: jobId })
      .populate('job', 'title')
      .populate('reviewer', 'fullName profilePicture role')
      .populate('reviewee', 'fullName profilePicture role')
      .sort({ createdAt: -1 });

    return reviews.map((review) =>
      this.transformReviewToPublic(review, review.reviewer, review.reviewee)
    );
  }

  /**
   * Update user's overall rating based on their reviews
   */
  private static async updateUserRating(userId: string): Promise<void> {
    const reviews = await Review.find({
      reviewee: userId,
      isVisible: true,
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

    await User.findByIdAndUpdate(userId, {
      rating: averageRating,
      ratingCount: reviews.length,
    });
  }

  /**
   * Transform review document to public interface
   */
  private static transformReviewToPublic(
    review: any,
    reviewer: any,
    reviewee: any
  ): IReviewPublic {
    return {
      id: review._id.toString(),
      job: review.job._id ? review.job._id.toString() : review.job.toString(),
      reviewer: {
        id: reviewer._id.toString(),
        fullName: reviewer.fullName,
        profilePicture: reviewer.profilePicture,
        role: reviewer.role,
      },
      reviewee: {
        id: reviewee._id.toString(),
        fullName: reviewee.fullName,
        profilePicture: reviewee.profilePicture,
        role: reviewee.role,
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  /**
   * Check if a user can review a specific job
   */
  static async canUserReviewJob(
    userId: string,
    jobId: string
  ): Promise<{
    canReview: boolean;
    reason?: string;
  }> {
    const job = await Job.findById(jobId);

    if (!job) {
      return { canReview: false, reason: 'Job not found' };
    }

    if (job.status !== 'Completed') {
      return { canReview: false, reason: 'Job must be completed to review' };
    }

    const isClient = job.client.toString() === userId;
    const isCraftsman = job.craftsman && job.craftsman.toString() === userId;

    if (!isClient && !isCraftsman) {
      return { canReview: false, reason: 'You are not part of this job' };
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      job: jobId,
      reviewer: userId,
    });

    if (existingReview) {
      return { canReview: false, reason: 'You have already reviewed this job' };
    }

    return { canReview: true };
  }
}
