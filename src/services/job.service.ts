import { Job } from '../models/job.model.js';
import { IJob } from '../types/job.types.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';

export class JobService {
  static async createJob(data: Partial<IJob> & { client: Types.ObjectId }) {
    const job = new Job(data);
    await job.save();
    return job;
  }

  static async getJobs(filter: any = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [jobs, totalItems] = await Promise.all([
      Job.find(filter).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return { jobs, pagination: { page, limit, totalPages, totalItems } };
  }

  static async getJobById(jobId: string) {
    return Job.findById(jobId).lean();
  }

  static async updateJob(jobId: string, clientId: Types.ObjectId, update: Partial<IJob>) {
    const job = await Job.findOneAndUpdate({ _id: jobId, client: clientId }, update, { new: true });
    return job;
  }

  static async deleteJob(jobId: string, clientId: Types.ObjectId) {
    const job = await Job.findOneAndDelete({ _id: jobId, client: clientId });
    return job;
  }

  static async updateJobStatus(jobId: string, status: IJob['status']) {
    const job = await Job.findByIdAndUpdate(jobId, { status }, { new: true });
    if (job) {
      // Notify client
      await NotificationService.sendNotification({
        user: job.client,
        type: 'status',
        title: 'Job Status Updated',
        message: `The status of job '${job.title}' has changed to ${status}.`,
        data: { jobId, status },
      });
      // Notify craftsman if assigned
      if (job.craftsman) {
        await NotificationService.sendNotification({
          user: job.craftsman,
          type: 'status',
          title: 'Job Status Updated',
          message: `The status of job '${job.title}' has changed to ${status}.`,
          data: { jobId, status },
        });
      }
    }
    return job;
  }
} 