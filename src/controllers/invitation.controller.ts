import { Response } from 'express';
import { InvitationService } from '../services/invitation.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import { PaginationHelper } from '../utils/paginationHelper.js';

export class InvitationController {
  // POST /api/jobs/:jobId/invite (Client only)
  static async inviteCraftsman(req: IAuthenticatedRequest, res: Response) {
    try {
      const { craftsmanId } = req.body;
      if (!craftsmanId)
        return res.status(400).json({ message: 'craftsmanId is required' });
      const invitation = await InvitationService.inviteCraftsman(
        req.params.jobId,
        new Types.ObjectId(craftsmanId)
      );
      return res.status(201).json({ data: invitation });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to invite craftsman',
      });
    }
  }

  // GET /api/jobs/:jobId/invitations (Client only)
  static async getInvitationsForJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const invitations = await InvitationService.getInvitationsForJob(
        req.params.jobId
      );
      return res.json({ data: invitations });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  }

  // POST /api/jobs/:jobId/invitations/respond (Craftsman only)
  static async respondToInvitation(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId)
        return res.status(401).json({ message: 'Unauthorized' });
      const { response } = req.body;
      if (!['Accepted', 'Rejected'].includes(response))
        return res.status(400).json({ message: 'Invalid response' });

      const invitation = await InvitationService.respondToInvitation(
        req.params.jobId,
        new Types.ObjectId(craftsmanId),
        response
      );
      return res.json({ data: invitation });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to respond to invitation',
      });
    }
  }

  // GET /api/users/me/invitations (Craftsman only)
  static async getCraftsmanInvitations(
    req: IAuthenticatedRequest,
    res: Response
  ) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId)
        return res.status(401).json({ message: 'Unauthorized' });

      const { page, limit } = PaginationHelper.parseParams(req.query);
      const { status } = req.query;

      const result = await InvitationService.getCraftsmanInvitations(
        new Types.ObjectId(craftsmanId),
        page,
        limit,
        status as string | undefined
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Failed to fetch craftsman invitations',
        success: false,
      });
    }
  }
}
