import { Types } from 'mongoose';
import { Dispute } from '../models/dispute.model.js';
import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import { IDisputeCreate, IDisputePublic } from '../types/dispute.types.js';
import { ActionLogService } from './actionLog.service.js';
import { NotificationService } from './notification.service.js';
import cloudinary from '../utils/cloudinary.js';

export class DisputeServiceError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'DisputeServiceError';
  }
}

export class DisputeService {
  /**
   * Create a new dispute for a hired job
   */
  static async createDispute(
    userId: string,
    disputeData: IDisputeCreate,
    files?: Express.Multer.File[],
    userIP?: string
  ): Promise<IDisputePublic> {
    // Find the job and validate it
    const job = await Job.findById(disputeData.jobId)
      .populate('client', 'fullName profilePicture role')
      .populate('craftsman', 'fullName profilePicture role');

    if (!job) {
      throw new DisputeServiceError('Job not found', 404);
    }

    // Check if job is hired (craftsman assigned)
    if (!job.craftsman || job.status === 'Posted') {
      throw new DisputeServiceError('Can only dispute hired jobs', 400);
    }

    // Check if user is part of this job
    const isClient = job.client._id.toString() === userId;
    const isCraftsman = job.craftsman._id.toString() === userId;

    if (!isClient && !isCraftsman) {
      throw new DisputeServiceError(
        'You are not authorized to dispute this job',
        403
      );
    }

    // Check if dispute already exists for this job
    const existingDispute = await Dispute.findOne({ job: job._id });
    if (existingDispute) {
      throw new DisputeServiceError(
        'A dispute already exists for this job',
        400
      );
    }

    // Determine initiator and respondent
    const initiator = new Types.ObjectId(userId);
    const respondent = isClient ? job.craftsman._id : job.client._id;

    // Upload evidence images if provided
    let evidenceImages: string[] = [];
    if (files && files.length > 0) {
      evidenceImages = await this.uploadEvidenceImages(files);
    }

    // Prepare evidence array
    const evidence = disputeData.evidence || {};
    const evidenceArray = [
      {
        text: evidence.text,
        images:
          evidenceImages.length > 0 ? evidenceImages : evidence.images || [],
        attachments: [],
      },
    ];

    // Determine priority based on reason
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (
      disputeData.reason === 'no_show' ||
      disputeData.reason === 'behavior_issue'
    ) {
      priority = 'high';
    } else if (disputeData.reason === 'payment_issue') {
      priority = 'high';
    }

    // Create the dispute
    const dispute = new Dispute({
      job: job._id,
      initiator,
      respondent,
      reason: disputeData.reason,
      description: disputeData.description.trim(),
      status: 'open',
      priority,
      evidence: evidenceArray,
    });

    await dispute.save();

    // Update job status to disputed
    await Job.findByIdAndUpdate(job._id, { status: 'Disputed' });

    // Log the action
    await ActionLogService.logAction({
      userId,
      action: 'dispute_created',
      category: 'content',
      details: {
        jobId: job._id.toString(),
        respondentId: respondent.toString(),
        reason: disputeData.reason,
        priority,
      },
      ipAddress: userIP,
      success: true,
    });

    // Send notification to the respondent
    await NotificationService.sendNotification({
      user: respondent,
      type: 'dispute',
      title: 'Dispute Opened',
      message: `A dispute has been opened for job "${job.title}"`,
      data: {
        jobId: job._id.toString(),
        disputeId: dispute._id.toString(),
        reason: disputeData.reason,
      },
    });

    // Send notification to admins
    const admins = await User.find({ role: { $in: ['admin', 'moderator'] } });
    for (const admin of admins) {
      await NotificationService.sendNotification({
        user: admin._id,
        type: 'admin',
        title: 'New Dispute Requires Attention',
        message: `A ${priority} priority dispute has been opened for job "${job.title}"`,
        data: {
          jobId: job._id.toString(),
          disputeId: dispute._id.toString(),
          priority,
          reason: disputeData.reason,
        },
      });
    }

    return this.transformDisputeToPublic(
      dispute,
      job.client,
      job.craftsman,
      job
    );
  }

  /**
   * Get dispute details
   */
  static async getDispute(
    disputeId: string,
    userId: string,
    userRole: string
  ): Promise<IDisputePublic> {
    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'title status')
      .populate('initiator', 'fullName profilePicture role')
      .populate('respondent', 'fullName profilePicture role');

    if (!dispute) {
      throw new DisputeServiceError('Dispute not found', 404);
    }

    // Check authorization
    const isInvolved =
      dispute.initiator._id.toString() === userId ||
      dispute.respondent._id.toString() === userId;
    const isAdmin = userRole === 'admin' || userRole === 'moderator';

    if (!isInvolved && !isAdmin) {
      throw new DisputeServiceError(
        'You are not authorized to view this dispute',
        403
      );
    }

    return this.transformDisputeToPublic(
      dispute,
      dispute.initiator,
      dispute.respondent,
      dispute.job
    );
  }

  /**
   * Add evidence to an existing dispute
   */
  static async addEvidence(
    disputeId: string,
    userId: string,
    evidence: { text?: string },
    files?: Express.Multer.File[],
    userIP?: string
  ): Promise<IDisputePublic> {
    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'title status')
      .populate('initiator', 'fullName profilePicture role')
      .populate('respondent', 'fullName profilePicture role');

    if (!dispute) {
      throw new DisputeServiceError('Dispute not found', 404);
    }

    // Check if user is involved in the dispute
    const isInvolved =
      dispute.initiator._id.toString() === userId ||
      dispute.respondent._id.toString() === userId;

    if (!isInvolved) {
      throw new DisputeServiceError(
        'You are not authorized to add evidence to this dispute',
        403
      );
    }

    // Check if dispute is still open for evidence
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new DisputeServiceError(
        'Cannot add evidence to a resolved or closed dispute',
        400
      );
    }

    // Upload evidence images if provided
    let evidenceImages: string[] = [];
    if (files && files.length > 0) {
      evidenceImages = await this.uploadEvidenceImages(files);
    }

    // Add new evidence
    dispute.evidence.push({
      text: evidence.text,
      images: evidenceImages,
      attachments: [],
    });

    await dispute.save();

    // Log the action
    await ActionLogService.logAction({
      userId,
      action: 'dispute_evidence_added',
      category: 'content',
      details: {
        disputeId: dispute._id.toString(),
        evidenceCount: dispute.evidence.length,
      },
      ipAddress: userIP,
      success: true,
    });

    return this.transformDisputeToPublic(
      dispute,
      dispute.initiator,
      dispute.respondent,
      dispute.job
    );
  }

  /**
   * Get user's disputes
   */
  static async getUserDisputes(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{
    disputes: IDisputePublic[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const filter: any = {
      $or: [{ initiator: userId }, { respondent: userId }],
    };

    if (status) {
      filter.status = status;
    }

    const [disputes, totalItems] = await Promise.all([
      Dispute.find(filter)
        .populate('job', 'title status')
        .populate('initiator', 'fullName profilePicture role')
        .populate('respondent', 'fullName profilePicture role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const transformedDisputes = disputes.map((dispute) =>
      this.transformDisputeToPublic(
        dispute,
        dispute.initiator,
        dispute.respondent,
        dispute.job
      )
    );

    return {
      disputes: transformedDisputes,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    };
  }

  /**
   * Get all disputes for admin
   */
  static async getAllDisputes(
    page: number = 1,
    limit: number = 20,
    status?: string,
    priority?: string
  ): Promise<{
    disputes: IDisputePublic[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const [disputes, totalItems] = await Promise.all([
      Dispute.find(filter)
        .populate('job', 'title status')
        .populate('initiator', 'fullName profilePicture role')
        .populate('respondent', 'fullName profilePicture role')
        .sort({ priority: 1, createdAt: -1 }) // High priority first
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const transformedDisputes = disputes.map((dispute) =>
      this.transformDisputeToPublic(
        dispute,
        dispute.initiator,
        dispute.respondent,
        dispute.job
      )
    );

    return {
      disputes: transformedDisputes,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    };
  }

  /**
   * Resolve a dispute (admin only)
   */
  static async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: {
      decision: string;
      refundAmount?: number;
      penaltyToUser?: string;
    },
    userIP?: string
  ): Promise<IDisputePublic> {
    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'title status')
      .populate('initiator', 'fullName profilePicture role')
      .populate('respondent', 'fullName profilePicture role');

    if (!dispute) {
      throw new DisputeServiceError('Dispute not found', 404);
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new DisputeServiceError(
        'Dispute is already resolved or closed',
        400
      );
    }

    // Get job title safely
    const jobDoc = dispute.job as any;
    const jobTitle = jobDoc.title || 'Unknown Job';

    // Update dispute with resolution
    dispute.status = 'resolved';
    dispute.resolution = {
      decision: resolution.decision.trim(),
      refundAmount: resolution.refundAmount,
      penaltyToUser: resolution.penaltyToUser
        ? new Types.ObjectId(resolution.penaltyToUser)
        : undefined,
      resolvedBy: new Types.ObjectId(adminId),
      resolvedAt: new Date(),
    };

    await dispute.save();

    // Update job status back to completed if it was disputed
    const jobDocument = await Job.findById(dispute.job._id);
    if (jobDocument && jobDocument.status === 'Disputed') {
      await Job.findByIdAndUpdate(dispute.job._id, { status: 'Completed' });
    }

    // Log the action
    await ActionLogService.logAction({
      userId: adminId,
      action: 'dispute_resolved',
      category: 'content',
      details: {
        disputeId: dispute._id.toString(),
        decision: resolution.decision,
        refundAmount: resolution.refundAmount,
      },
      ipAddress: userIP,
      success: true,
    });

    // Send notifications to both parties
    await NotificationService.sendNotification({
      user: dispute.initiator._id,
      type: 'dispute',
      title: 'Dispute Resolved',
      message: `Your dispute for "${jobTitle}" has been resolved`,
      data: {
        disputeId: dispute._id.toString(),
        decision: resolution.decision,
      },
    });

    await NotificationService.sendNotification({
      user: dispute.respondent._id,
      type: 'dispute',
      title: 'Dispute Resolved',
      message: `The dispute for "${jobTitle}" has been resolved`,
      data: {
        disputeId: dispute._id.toString(),
        decision: resolution.decision,
      },
    });

    return this.transformDisputeToPublic(
      dispute,
      dispute.initiator,
      dispute.respondent,
      dispute.job
    );
  }

  /**
   * Upload evidence images to Cloudinary
   */
  private static async uploadEvidenceImages(
    files: Express.Multer.File[]
  ): Promise<string[]> {
    const streamifier = await import('streamifier');

    const uploadPromises = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'dispute-evidence',
              resource_type: 'image',
              format: 'webp',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error || !result) {
                return reject(error || new Error('No result from Cloudinary'));
              }
              resolve(result.secure_url);
            }
          );
          streamifier.default.createReadStream(file.buffer).pipe(stream);
        })
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new DisputeServiceError('Failed to upload evidence images', 500);
    }
  }

  /**
   * Transform dispute document to public interface
   */
  private static transformDisputeToPublic(
    dispute: any,
    initiator: any,
    respondent: any,
    job: any
  ): IDisputePublic {
    return {
      id: dispute._id.toString(),
      job: {
        id: job._id ? job._id.toString() : job.toString(),
        title: job.title || 'Unknown Job',
        status: job.status || 'Unknown',
      },
      initiator: {
        id: initiator._id.toString(),
        fullName: initiator.fullName,
        role: initiator.role,
      },
      respondent: {
        id: respondent._id.toString(),
        fullName: respondent.fullName,
        role: respondent.role,
      },
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      evidence: dispute.evidence || [],
      adminNotes: dispute.adminNotes,
      resolution: dispute.resolution
        ? {
            decision: dispute.resolution.decision,
            refundAmount: dispute.resolution.refundAmount,
            resolvedAt: dispute.resolution.resolvedAt,
          }
        : undefined,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}
