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

    // If not, search by name
    const serviceDoc = await Service.findOne({
      name: { $regex: service, $options: 'i' },
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

  static async updateJobStatus(jobId: string, status: IJob['status']) {
    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        status,
        ...(status === 'Completed' && { completedAt: new Date() }),
      },
      { new: true }
    ).populate('craftsman', '_id role wallet');

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
          // This ensures job completion is recorded
        }
      }

      // Notify client
      await NotificationService.sendNotification({
        user: job.client,
        type: 'status',
        title: 'Job Status Updated',
        message: `The status of job '${job.title}' has changed to ${status}.`,
        data: { jobId, status },
      });

      // Notify craftsman if assigned
      if (job.craftsman)
        await NotificationService.sendNotification({
          user: job.craftsman._id,
          type: 'status',
          title: 'Job Status Updated',
          message: `The status of job '${job.title}' has changed to ${status}.`,
          data: { jobId, status },
        });
    }
    return job;
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
