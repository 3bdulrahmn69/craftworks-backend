import { Invitation } from '../models/invitation.model.js';
import { Job } from '../models/job.model.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';

export class InvitationService {
  static async inviteCraftsman(jobId: string, craftsmanId: Types.ObjectId) {
    // Prevent duplicate invitations
    const existing = await Invitation.findOne({
      job: jobId,
      craftsman: craftsmanId,
    });
    if (existing) throw new Error('Craftsman already invited to this job');

    const invitation = new Invitation({ job: jobId, craftsman: craftsmanId });
    await invitation.save();
    // Notify craftsman
    const job = await Job.findById(jobId).lean();
    if (job)
      await NotificationService.sendNotification({
        user: craftsmanId,
        type: 'invitation',
        title: 'You Were Invited to a Job',
        message: `You have been invited to apply for the job: ${job.title}`,
        data: { jobId, invitationId: invitation._id, clientId: job.client },
      });

    return invitation;
  }

  static async getInvitationsForJob(jobId: string) {
    return Invitation.find({ job: jobId })
      .populate('craftsman', 'fullName profilePicture rating ratingCount')
      .lean();
  }

  static async respondToInvitation(
    jobId: string,
    craftsmanId: Types.ObjectId,
    response: 'Accepted' | 'Rejected'
  ) {
    const invitation = await Invitation.findOne({
      job: jobId,
      craftsman: craftsmanId,
    });
    if (!invitation) throw new Error('Invitation not found');

    if (invitation.status !== 'Pending')
      throw new Error('Invitation already responded to');

    invitation.status = response;
    invitation.respondedAt = new Date();
    await invitation.save();
    // Notify client
    const job = await Job.findById(jobId).lean();
    if (job && job.client)
      await NotificationService.sendNotification({
        user: job.client,
        type: 'invitation',
        title: 'Invitation Response',
        message: `A craftsman has ${response.toLowerCase()} your invitation for the job: ${
          job.title
        }`,
        data: { jobId, invitationId: invitation._id, craftsmanId, response },
      });

    return invitation;
  }

  /**
   * Get all invitations received by a specific craftsman
   */
  static async getCraftsmanInvitations(
    craftsmanId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    const filter: any = { craftsman: craftsmanId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sort = { createdAt: -1 as const }; // Most recent first

    const [invitations, totalItems] = await Promise.all([
      Invitation.find(filter)
        .populate({
          path: 'job',
          select:
            'title description category photos address location status client createdAt paymentType',
          populate: {
            path: 'client',
            select: 'fullName profilePicture rating ratingCount',
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Invitation.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: invitations,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
