import { Request, Response } from 'express';
import {
  ReviewService,
  ReviewServiceError,
} from '../services/review.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { IAuthenticatedRequest } from '../types/common.types.js';

export class ReviewController {
  /**
   * Create a new review for a completed job
   */
  static createReview = asyncHandler(
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

        const { jobId, rating, comment } = req.body;

        // Validate required fields
        if (!jobId || !rating) {
          ApiResponse.badRequest(res, 'Job ID and rating are required');
          return;
        }

        // Validate rating
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          ApiResponse.badRequest(
            res,
            'Rating must be an integer between 1 and 5'
          );
          return;
        }

        // Validate comment length if provided
        if (comment && comment.trim().length > 1000) {
          ApiResponse.badRequest(res, 'Comment cannot exceed 1000 characters');
          return;
        }

        const review = await ReviewService.createReview(
          userId,
          { jobId, rating, comment },
          req.ip
        );

        ApiResponse.success(res, review, 'Review created successfully', 201);
      } catch (error) {
        if (error instanceof ReviewServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to create review');
        }
      }
    }
  );

  /**
   * Get reviews for a specific user
   */
  static getUserReviews = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        if (!userId) {
          ApiResponse.badRequest(res, 'User ID is required');
          return;
        }

        const result = await ReviewService.getUserReviews(userId, page, limit);

        ApiResponse.success(
          res,
          {
            reviews: result.reviews,
            pagination: result.pagination,
          },
          'Reviews retrieved successfully'
        );
      } catch (error) {
        if (error instanceof ReviewServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to retrieve reviews');
        }
      }
    }
  );

  /**
   * Get reviews for a specific job
   */
  static getJobReviews = asyncHandler(
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

        const { jobId } = req.params;

        if (!jobId) {
          ApiResponse.badRequest(res, 'Job ID is required');
          return;
        }

        const reviews = await ReviewService.getJobReviews(jobId, userId);

        ApiResponse.success(res, reviews, 'Job reviews retrieved successfully');
      } catch (error) {
        if (error instanceof ReviewServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to retrieve job reviews');
        }
      }
    }
  );

  /**
   * Check if user can review a job
   */
  static canReviewJob = asyncHandler(
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

        const { jobId } = req.params;

        if (!jobId) {
          ApiResponse.badRequest(res, 'Job ID is required');
          return;
        }

        const result = await ReviewService.canUserReviewJob(userId, jobId);

        ApiResponse.success(
          res,
          result,
          'Review eligibility checked successfully'
        );
      } catch (error) {
        ApiResponse.internalError(res, 'Failed to check review eligibility');
      }
    }
  );
}
