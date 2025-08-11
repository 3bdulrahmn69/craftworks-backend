import { Job } from '../models/job.model.js';
import { Service } from '../models/service.model.js';
import { IJob, JobStatus } from '../types/job.types.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';
import { PaginationHelper } from '../utils/paginationHelper.js';
import { WalletService } from './wallet.service.js';

export class JobService {
  // Helper method to resolve service by name or ID
  private static async resolveServiceId(
    service: string
  ): Promise<string | null> {
    // Check if it's a valid ObjectId
    if (Types.ObjectId.isValid(service)) return service;

    // If not, search by name in both languages
    const serviceDoc = await Service.findOne({
      $or: [
        { 'name.en': { $regex: service, $options: 'i' } },
        { 'name.ar': { $regex: service, $options: 'i' } },
      ],
    });
    return serviceDoc?._id.toString() || null;
  }

  static async createJob(data: Partial<IJob> & { client: Types.ObjectId }) {
    const job = new Job(data);
    await job.save();
    return job;
  }

  static async getJobs(filter: any = {}, page = 1, limit = 10) {
    return PaginationHelper.paginate(
      Job,
      filter,
      page,
      limit,
      {
        createdAt: -1,
      },
      {
        path: 'service',
        select: 'name icon description', // Exclude createdAt and updatedAt
      }
    );
  }

  static async searchJobs(
    searchTerm: string,
    filters: any = {},
    page = 1,
    limit = 10
  ) {
    // Handle service filter if present
    if (filters.service) {
      const serviceId = await this.resolveServiceId(filters.service);
      if (serviceId) filters.service = serviceId;
      // If service not found, return empty results
      else
        return {
          data: [],
          pagination: {
            page,
            limit,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
    }

    // Build search query
    const searchQuery = {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    // Combine search with other filters
    const combinedFilter = { ...filters, ...searchQuery };

    return PaginationHelper.paginate(
      Job,
      combinedFilter,
      page,
      limit,
      {
        createdAt: -1,
      },
      {
        path: 'service',
        select: 'name icon description', // Exclude createdAt and updatedAt
      }
    );
  }

  static async getJobsWithAdvancedFilters(
    filters: {
      service?: string;
      status?: string;
      state?: string;
      city?: string;
      paymentType?: string;
    } = {},
    page = 1,
    limit = 10
  ) {
    const query: any = {};

    // Handle service filter - support both ID and name
    if (filters.service) {
      const serviceId = await this.resolveServiceId(filters.service);
      if (serviceId) query.service = serviceId;
      // If service not found, return empty results
      else
        return {
          data: [],
          pagination: {
            page,
            limit,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
    }

    // Basic filters
    if (filters.status) query.status = filters.status;
    if (filters.paymentType) query.paymentType = filters.paymentType;

    // Address filters
    if (filters.state)
      query['address.state'] = { $regex: filters.state, $options: 'i' };
    if (filters.city)
      query['address.city'] = { $regex: filters.city, $options: 'i' };

    return PaginationHelper.paginate(
      Job,
      query,
      page,
      limit,
      {
        createdAt: -1,
      },
      {
        path: 'service',
        select: 'name icon description', // Exclude createdAt and updatedAt
      }
    );
  }

  static async getJobById(jobId: string) {
    return Job.findById(jobId)
      .populate({
        path: 'service',
        select: 'name icon description', // Exclude createdAt and updatedAt
      })
      .lean();
  }

  static async updateJob(
    jobId: string,
    clientId: Types.ObjectId,
    update: Partial<IJob>
  ) {
    const job = await Job.findOneAndUpdate(
      { _id: jobId, client: clientId },
      update,
      { new: true }
    );
    return job;
  }

  static async deleteJob(jobId: string, clientId: Types.ObjectId) {
    const job = await Job.findOneAndDelete({ _id: jobId, client: clientId });
    return job;
  }

  static async updateJobStatus(
    jobId: string,
    status: IJob['status'],
    userId: string,
    userRole: string,
    newJobDate?: Date
  ) {
    // Get the job first to check current status and permissions
    const existingJob = await Job.findById(jobId)
      .populate('client', '_id role')
      .populate('craftsman', '_id role wallet');

    if (!existingJob) {
      throw new Error('Job not found');
    }

    // Validate status transitions and permissions
    await this.validateStatusTransition(existingJob, status, userId, userRole);

    // Prepare update data
    const updateData: any = { status };

    // Handle specific status transitions
    switch (status) {
      case 'On The Way':
        // Only craftsman can change to "On The Way"
        if (
          userRole !== 'craftsman' ||
          existingJob.craftsman?._id.toString() !== userId
        ) {
          throw new Error(
            'Only the assigned craftsman can change status to "On The Way"'
          );
        }
        break;

      case 'Completed':
        // Only client can change to "Completed"
        if (
          userRole !== 'client' ||
          existingJob.client._id.toString() !== userId
        ) {
          throw new Error('Only the client can change status to "Completed"');
        }
        updateData.completedAt = new Date();
        break;

      case 'Cancelled':
        // Both can cancel, but not if completed or on the way
        if (['Completed', 'On The Way'].includes(existingJob.status)) {
          throw new Error('Cannot cancel job that is completed or on the way');
        }
        break;

      case 'Rescheduled':
        // Only craftsman can reschedule and only if "On The Way"
        if (
          userRole !== 'craftsman' ||
          existingJob.craftsman?._id.toString() !== userId
        ) {
          throw new Error('Only the assigned craftsman can reschedule the job');
        }
        if (existingJob.status !== 'On The Way') {
          throw new Error(
            'Job can only be rescheduled when status is "On The Way"'
          );
        }
        if (!newJobDate) {
          throw new Error('New job date is required for rescheduling');
        }
        updateData.jobDate = newJobDate;
        break;
    }

    const job = await Job.findByIdAndUpdate(jobId, updateData, { new: true })
      .populate('craftsman', '_id role wallet')
      .populate('client', '_id role');

    if (job) {
      // Handle payment when job is completed and payment type is visa
      if (
        status === 'Completed' &&
        job.paymentType === 'visa' &&
        job.craftsman &&
        job.jobPrice > 0
      ) {
        try {
          await WalletService.creditWallet(
            job.craftsman._id,
            job.jobPrice,
            jobId,
            `Payment for completed job: ${job.title}`
          );
        } catch (paymentError) {
          console.error('Failed to process payment:', paymentError);
          // Continue with status update even if payment fails
        }
      }

      // Send notifications
      await this.sendStatusNotifications(job, status, newJobDate);
    }

    return job;
  }

  static async validateStatusTransition(
    job: any,
    newStatus: IJob['status'],
    userId: string,
    userRole: string
  ) {
    const currentStatus = job.status;
    const isClient =
      userRole === 'client' && job.client._id.toString() === userId;
    const isCraftsman =
      userRole === 'craftsman' && job.craftsman?._id.toString() === userId;
    const isJobParticipant = isClient || isCraftsman;

    if (!isJobParticipant) {
      throw new Error('You are not authorized to update this job');
    }

    // Validate specific transitions
    const validTransitions: { [key: string]: string[] } = {
      Posted: ['Hired', 'Cancelled'],
      Hired: ['On The Way', 'Cancelled', 'Disputed'],
      'On The Way': ['Completed', 'Rescheduled', 'Disputed'],
      Rescheduled: ['On The Way', 'Cancelled', 'Disputed'],
      Completed: ['Disputed'], // Only disputes allowed after completion
      Disputed: [], // No transitions from disputed (handled by admin)
      Cancelled: [], // No transitions from cancelled
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  static async sendStatusNotifications(
    job: any,
    status: IJob['status'],
    newJobDate?: Date
  ) {
    let message = `The status of job '${job.title}' has changed to ${status}.`;

    if (status === 'Rescheduled' && newJobDate) {
      message += ` New date: ${newJobDate.toLocaleDateString()}.`;
    }

    // Notify client
    await NotificationService.sendNotification({
      user: job.client._id,
      type: 'status',
      title: 'Job Status Updated',
      message,
      data: { jobId: job._id, status, newJobDate },
    });

    // Notify craftsman if assigned
    if (job.craftsman) {
      await NotificationService.sendNotification({
        user: job.craftsman._id,
        type: 'status',
        title: 'Job Status Updated',
        message,
        data: { jobId: job._id, status, newJobDate },
      });
    }
  }

  static async updateJobDate(
    jobId: string,
    newJobDate: Date,
    userId: string,
    userRole: string
  ) {
    const job = await Job.findById(jobId).populate('client craftsman');

    if (!job) {
      throw new Error('Job not found');
    }

    // Only client can change job date and only until craftsman is "On The Way"
    if (userRole !== 'client' || job.client._id.toString() !== userId) {
      throw new Error('Only the client can change the job date');
    }

    if (job.status === 'On The Way') {
      throw new Error('Cannot change job date when craftsman is on the way');
    }

    if (['Completed', 'Cancelled', 'Disputed'].includes(job.status)) {
      throw new Error(
        'Cannot change job date for completed, cancelled, or disputed jobs'
      );
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { jobDate: newJobDate },
      { new: true }
    ).populate('client craftsman service');

    if (updatedJob) {
      // Notify craftsman if assigned
      if (updatedJob.craftsman) {
        await NotificationService.sendNotification({
          user: updatedJob.craftsman._id,
          type: 'job_update',
          title: 'Job Date Changed',
          message: `The date for job '${
            updatedJob.title
          }' has been changed to ${newJobDate.toLocaleDateString()}.`,
          data: { jobId, newJobDate },
        });
      }
    }

    return updatedJob;
  }

  static async getJobsByClient(
    clientId: string,
    page = 1,
    limit = 10,
    status?: JobStatus
  ) {
    const filter: any = { client: clientId };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    return PaginationHelper.paginate(
      Job,
      filter,
      page,
      limit,
      { createdAt: -1 },
      [
        {
          path: 'service',
          select: 'name icon description',
        },
        {
          path: 'craftsman',
          select: 'fullName phone',
        },
      ]
    );
  }

  static async getJobsByCraftsman(
    craftsmanId: string,
    page = 1,
    limit = 10,
    status?: JobStatus
  ) {
    const filter: any = { craftsman: craftsmanId };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    return PaginationHelper.paginate(
      Job,
      filter,
      page,
      limit,
      { createdAt: -1 },
      [
        {
          path: 'service',
          select: 'name icon description',
        },
        {
          path: 'client',
          select: 'fullName phone',
        },
      ]
    );
  }
}
