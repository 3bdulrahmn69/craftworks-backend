import { Invitation } from '../models/invitation.model.js';
import { Job } from '../models/job.model.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';

export class InvitationService {
  static async inviteCraftsman(jobId: string, craftsmanId: Types.ObjectId) {
    // Prevent duplicate invitations
    const existing = await Invitation.findOne({ job: jobId, craftsman: craftsmanId });
    if (existing) throw new Error('Craftsman already invited to this job');
    const invitation = new Invitation({ job: jobId, craftsman: craftsmanId });
    await invitation.save();
    // Notify craftsman
    const job = await Job.findById(jobId).lean();
    if (job) {
      await NotificationService.sendNotification({
        user: craftsmanId,
        type: 'invitation',
        title: 'You Were Invited to a Job',
        message: `You have been invited to apply for the job: ${job.title}`,
        data: { jobId, invitationId: invitation._id, clientId: job.client },
      });
    }
    return invitation;
  }

  static async getInvitationsForJob(jobId: string) {
    return Invitation.find({ job: jobId }).populate('craftsman', 'fullName profilePicture rating rating_count').lean();
  }

  static async respondToInvitation(jobId: string, craftsmanId: Types.ObjectId, response: 'Accepted' | 'Rejected') {
    const invitation = await Invitation.findOne({ job: jobId, craftsman: craftsmanId });
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.status !== 'Pending') throw new Error('Invitation already responded to');
    invitation.status = response;
    invitation.respondedAt = new Date();
    await invitation.save();
    // Notify client
    const job = await Job.findById(jobId).lean();
    if (job && job.client) {
      await NotificationService.sendNotification({
        user: job.client,
        type: 'invitation',
        title: 'Invitation Response',
        message: `A craftsman has ${response.toLowerCase()} your invitation for the job: ${job.title}`,
        data: { jobId, invitationId: invitation._id, craftsmanId, response },
      });
    }
    return invitation;
  }
} 