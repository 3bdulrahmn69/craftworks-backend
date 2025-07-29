import { Response } from 'express';
import { InvitationService } from '../services/invitation.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import { PaginationHelper } from '../utils/paginationHelper.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class InvitationController {
  // POST /api/jobs/:jobId/invite (Client only)
  static async inviteCraftsman(req: IAuthenticatedRequest, res: Response) {
    try {
      const { craftsmanId } = req.body;
      if (!craftsmanId)
        return ApiResponse.badRequest(res, 'craftsmanId is required');
      const invitation = await InvitationService.inviteCraftsman(
        req.params.jobId,
        new Types.ObjectId(craftsmanId)
      );
      return ApiResponse.success(
        res,
        invitation,
        'Craftsman invited successfully',
        201
      );
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error ? error.message : 'Failed to invite craftsman'
      );
    }
  }

  // GET /api/jobs/:jobId/invitations (Client only)
  static async getInvitationsForJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const invitations = await InvitationService.getInvitationsForJob(
        req.params.jobId
      );
      return ApiResponse.success(
        res,
        invitations,
        'Invitations retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch invitations', 500);
    }
  }

  // POST /api/jobs/:jobId/invitations/respond (Craftsman only)
  static async respondToInvitation(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const { response } = req.body;
      if (!['Accepted', 'Rejected'].includes(response))
        return ApiResponse.badRequest(res, 'Invalid response');

      const invitation = await InvitationService.respondToInvitation(
        req.params.jobId,
        new Types.ObjectId(craftsmanId),
        response
      );
      return ApiResponse.success(
        res,
        invitation,
        'Invitation response recorded successfully'
      );
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error
          ? error.message
          : 'Failed to respond to invitation'
      );
    }
  }

  // GET /api/users/me/invitations (Craftsman only)
  static async getCraftsmanInvitations(
    req: IAuthenticatedRequest,
    res: Response
  ) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const { page, limit } = PaginationHelper.parseParams(req.query);
      const { status } = req.query;

      const result = await InvitationService.getCraftsmanInvitations(
        new Types.ObjectId(craftsmanId),
        page,
        limit,
        status as string | undefined
      );

      return ApiResponse.success(
        res,
        { data: result.data, pagination: result.pagination },
        'Craftsman invitations retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        'Failed to fetch craftsman invitations',
        500
      );
    }
  }
}
