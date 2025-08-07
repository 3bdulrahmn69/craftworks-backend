import { Response } from 'express';
import {
  DisputeService,
  DisputeServiceError,
} from '../services/dispute.service.js';
import { ApiResponse, asyncHandler } from '../utils/apiResponse.js';
import { IAuthenticatedRequest } from '../types/common.types.js';

export class DisputeController {
  /**
   * Create a new dispute for a hired job
   */
  static createDispute = asyncHandler(
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

        const { jobId, reason, description, evidence } = req.body;
        const files = (req as any).files as Express.Multer.File[] | undefined;

        // Validate required fields
        if (!jobId || !reason || !description) {
          ApiResponse.badRequest(
            res,
            'Job ID, reason, and description are required'
          );
          return;
        }

        // Validate reason
        const validReasons = [
          'poor_quality',
          'no_show',
          'payment_issue',
          'behavior_issue',
          'other',
        ];
        if (!validReasons.includes(reason)) {
          ApiResponse.badRequest(
            res,
            `Reason must be one of: ${validReasons.join(', ')}`
          );
          return;
        }

        // Validate description length
        if (
          description.trim().length < 10 ||
          description.trim().length > 2000
        ) {
          ApiResponse.badRequest(
            res,
            'Description must be between 10 and 2000 characters'
          );
          return;
        }

        // Parse evidence if provided
        let evidenceData = undefined;
        if (evidence) {
          try {
            evidenceData =
              typeof evidence === 'string' ? JSON.parse(evidence) : evidence;
          } catch (error) {
            ApiResponse.badRequest(res, 'Invalid evidence format');
            return;
          }
        }

        const dispute = await DisputeService.createDispute(
          userId,
          { jobId, reason, description, evidence: evidenceData },
          files,
          req.ip
        );

        ApiResponse.success(res, dispute, 'Dispute created successfully', 201);
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to create dispute');
        }
      }
    }
  );

  /**
   * Get dispute details
   */
  static getDispute = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
          ApiResponse.unauthorized(res, 'Authentication required');
          return;
        }

        const { disputeId } = req.params;

        if (!disputeId) {
          ApiResponse.badRequest(res, 'Dispute ID is required');
          return;
        }

        const dispute = await DisputeService.getDispute(
          disputeId,
          userId,
          userRole
        );

        ApiResponse.success(res, dispute, 'Dispute retrieved successfully');
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to retrieve dispute');
        }
      }
    }
  );

  /**
   * Add evidence to an existing dispute
   */
  static addEvidence = asyncHandler(
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

        const { disputeId } = req.params;
        const { text } = req.body;
        const files = (req as any).files as Express.Multer.File[] | undefined;

        if (!disputeId) {
          ApiResponse.badRequest(res, 'Dispute ID is required');
          return;
        }

        if (!text && (!files || files.length === 0)) {
          ApiResponse.badRequest(res, 'Either text or files must be provided');
          return;
        }

        // Validate text length if provided
        if (text && text.trim().length > 1000) {
          ApiResponse.badRequest(
            res,
            'Text evidence cannot exceed 1000 characters'
          );
          return;
        }

        const dispute = await DisputeService.addEvidence(
          disputeId,
          userId,
          { text },
          files,
          req.ip
        );

        ApiResponse.success(res, dispute, 'Evidence added successfully');
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to add evidence');
        }
      }
    }
  );

  /**
   * Get user's disputes
   */
  static getUserDisputes = asyncHandler(
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

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const status = req.query.status as string;

        const result = await DisputeService.getUserDisputes(
          userId,
          page,
          limit,
          status
        );

        ApiResponse.success(
          res,
          {
            disputes: result.disputes,
            pagination: result.pagination,
          },
          'Disputes retrieved successfully'
        );
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          ApiResponse.badRequest(res, error.message);
        } else {
          ApiResponse.internalError(res, 'Failed to retrieve disputes');
        }
      }
    }
  );

  /**
   * Get all disputes (admin only)
   */
  static getAllDisputes = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userRole = req.user?.role;
        if (userRole !== 'admin' && userRole !== 'moderator') {
          ApiResponse.forbidden(res, 'Admin or moderator access required');
          return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const status = req.query.status as string;
        const priority = req.query.priority as string;

        const result = await DisputeService.getAllDisputes(
          page,
          limit,
          status,
          priority
        );

        ApiResponse.success(
          res,
          {
            disputes: result.disputes,
            pagination: result.pagination,
          },
          'All disputes retrieved successfully'
        );
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          ApiResponse.badRequest(res, error.message);
        } else {
          ApiResponse.internalError(res, 'Failed to retrieve disputes');
        }
      }
    }
  );

  /**
   * Resolve a dispute (admin only)
   */
  static resolveDispute = asyncHandler(
    async (
      req: IAuthenticatedRequest,
      res: Response
    ): Promise<Response | void> => {
      try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || (userRole !== 'admin' && userRole !== 'moderator')) {
          ApiResponse.forbidden(res, 'Admin or moderator access required');
          return;
        }

        const { disputeId } = req.params;
        const { decision, refundAmount, penaltyToUser } = req.body;

        if (!disputeId || !decision) {
          ApiResponse.badRequest(res, 'Dispute ID and decision are required');
          return;
        }

        // Validate decision length
        if (decision.trim().length < 10 || decision.trim().length > 1000) {
          ApiResponse.badRequest(
            res,
            'Decision must be between 10 and 1000 characters'
          );
          return;
        }

        // Validate refund amount if provided
        if (
          refundAmount &&
          (typeof refundAmount !== 'number' || refundAmount < 0)
        ) {
          ApiResponse.badRequest(
            res,
            'Refund amount must be a positive number'
          );
          return;
        }

        const dispute = await DisputeService.resolveDispute(
          disputeId,
          userId,
          { decision, refundAmount, penaltyToUser },
          req.ip
        );

        ApiResponse.success(res, dispute, 'Dispute resolved successfully');
      } catch (error) {
        if (error instanceof DisputeServiceError) {
          if (error.statusCode === 404) {
            ApiResponse.notFound(res, error.message);
          } else if (error.statusCode === 403) {
            ApiResponse.forbidden(res, error.message);
          } else {
            ApiResponse.badRequest(res, error.message);
          }
        } else {
          ApiResponse.internalError(res, 'Failed to resolve dispute');
        }
      }
    }
  );
}
