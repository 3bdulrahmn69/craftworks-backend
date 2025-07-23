import { Response } from 'express';
import { JobService } from '../services/job.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';

export class JobController {
  // POST /api/jobs (Client only)
  static async createJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return res.status(401).json({ message: 'Unauthorized' });
      const job = await JobService.createJob({
        ...req.body,
        client: new Types.ObjectId(clientId),
      });
      return res.status(201).json({ data: job });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to create job',
      });
    }
  }

  // GET /api/jobs
  static async getJobs(req: IAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      // Add filters as needed (e.g., category, status)
      const filter: any = {};
      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.status = req.query.status;
      const { data: jobs, pagination } = await JobService.getJobs(
        filter,
        page,
        limit
      );
      return res.json({ data: jobs, pagination });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  }

  // GET /api/jobs/:jobId
  static async getJobById(req: IAuthenticatedRequest, res: Response) {
    try {
      const job = await JobService.getJobById(req.params.jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.json({ data: job });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch job' });
    }
  }

  // PUT /api/jobs/:jobId (Client only)
  static async updateJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return res.status(401).json({ message: 'Unauthorized' });
      const job = await JobService.updateJob(
        req.params.jobId,
        new Types.ObjectId(clientId),
        req.body
      );
      if (!job)
        return res
          .status(404)
          .json({ message: 'Job not found or not owned by user' });
      return res.json({ data: job });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to update job',
      });
    }
  }

  // DELETE /api/jobs/:jobId (Client only)
  static async deleteJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return res.status(401).json({ message: 'Unauthorized' });
      const job = await JobService.deleteJob(
        req.params.jobId,
        new Types.ObjectId(clientId)
      );
      if (!job)
        return res
          .status(404)
          .json({ message: 'Job not found or not owned by user' });
      return res.json({ message: 'Job deleted' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete job' });
    }
  }

  // PATCH /api/jobs/:jobId/status
  static async updateJobStatus(req: IAuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const { status } = req.body;
      const job = await JobService.updateJobStatus(jobId, status);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.json({ data: job });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update job status',
      });
    }
  }
}
