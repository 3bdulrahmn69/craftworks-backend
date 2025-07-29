import { Response } from 'express';
import { JobService } from '../services/job.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import cloudinary from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class JobController {
  // POST /api/jobs (Client only)
  static async createJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const jobData = { ...req.body, client: new Types.ObjectId(clientId) };

      // Process form data if it comes from multipart/form-data
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Parse nested address object
        if (req.body['address[country]']) {
          jobData.address = {
            country: req.body['address[country]'],
            state: req.body['address[state]'],
            city: req.body['address[city]'],
            street: req.body['address[street]'],
          };
          // Clean up the flat fields
          delete jobData['address[country]'];
          delete jobData['address[state]'];
          delete jobData['address[city]'];
          delete jobData['address[street]'];
        }

        // Parse location coordinates
        if (req.body['location[coordinates]'])
          try {
            const coordinatesInput = req.body['location[coordinates]'];
            let coordinates: number[] = [];

            console.log(
              'Raw coordinates input:',
              coordinatesInput,
              'Type:',
              typeof coordinatesInput
            );

            // Function to extract numbers from any string format
            const extractNumbers = (str: string): number[] => {
              // Remove all non-numeric characters except dots, commas, and minus signs
              const cleaned = str.replace(/[^\d.,-]/g, '');
              // Split by comma and parse each coordinate
              return cleaned
                .split(',')
                .map((coord) => parseFloat(coord.trim()))
                .filter((num) => !isNaN(num));
            };

            if (typeof coordinatesInput === 'string') {
              const cleanStr = coordinatesInput.trim();
              console.log('Processing string input:', cleanStr);

              // Handle various string formats
              if (cleanStr.includes(',')) {
                coordinates = extractNumbers(cleanStr);
                console.log('Extracted coordinates from string:', coordinates);
              }
              // Try JSON parsing for single values or arrays
              else
                try {
                  const parsed = JSON.parse(cleanStr);
                  if (Array.isArray(parsed))
                    coordinates = parsed.map((coord) =>
                      typeof coord === 'string' ? parseFloat(coord) : coord
                    );
                  else if (typeof parsed === 'number') coordinates = [parsed];
                } catch {
                  // If all else fails, try to parse as single number
                  const num = parseFloat(cleanStr);
                  if (!isNaN(num)) coordinates = [num];
                }
            } else if (Array.isArray(coordinatesInput)) {
              console.log('Processing array input:', coordinatesInput);

              // Handle array input
              coordinates = coordinatesInput
                .map((coord) => {
                  if (typeof coord === 'string') {
                    // If array contains strings like "31.2,30.1", extract numbers
                    if (coord.includes(',')) return extractNumbers(coord);
                    return parseFloat(coord);
                  }
                  return coord;
                })
                .flat(); // Flatten in case of nested arrays

              console.log('Processed array coordinates:', coordinates);
            } else if (typeof coordinatesInput === 'number')
              coordinates = [coordinatesInput];

            // Final safety check - ensure we have exactly 2 valid numbers
            coordinates = coordinates.filter(
              (num) => !isNaN(num) && isFinite(num)
            );

            console.log('Final processed coordinates:', coordinates);

            // Validate coordinates array
            if (
              !Array.isArray(coordinates) ||
              coordinates.length !== 2 ||
              coordinates.some(isNaN)
            )
              return ApiResponse.badRequest(
                res,
                `Location coordinates must be two valid numbers. Received: ${JSON.stringify(
                  coordinates
                )}. Format: "31.2,30.1" or [31.2, 30.1]`
              );

            jobData.location = {
              type: req.body['location[type]'] || 'Point',
              coordinates: coordinates,
            };
            // Clean up the flat fields
            delete jobData['location[type]'];
            delete jobData['location[coordinates]'];
          } catch (parseError) {
            const errorMessage =
              parseError instanceof Error
                ? parseError.message
                : 'Unknown parsing error';
            return ApiResponse.badRequest(
              res,
              `Invalid location coordinates format. Parse error: ${errorMessage}. Use "31.2,30.1" or "[31.2, 30.1]"`
            );
          }
      }

      // Additional coordinate processing for all request types (form-data and JSON)
      if (jobData.location && jobData.location.coordinates)
        if (typeof jobData.location.coordinates === 'string') {
          // If coordinates is still a string, parse it
          const coordStr = jobData.location.coordinates;
          console.log('Additional parsing needed for coordinates:', coordStr);

          // Use the same extraction logic
          const cleaned = coordStr.replace(/[^\d.,-]/g, '');
          const coordinates = cleaned
            .split(',')
            .map((coord: string) => parseFloat(coord.trim()))
            .filter((num: number) => !isNaN(num));

          console.log('Parsed coordinates:', coordinates);

          if (coordinates.length === 2)
            jobData.location.coordinates = coordinates;
          else
            return ApiResponse.badRequest(
              res,
              `Invalid coordinates format: ${coordStr}. Expected format: "31.2,30.1"`
            );
        }

      // Handle image uploads if any files are provided
      if (req.files && Array.isArray(req.files) && req.files.length > 0)
        try {
          // Import streamifier only if needed
          const streamifier = await import('streamifier');

          // Function to upload a single image to Cloudinary
          const uploadToCloudinary = (fileBuffer: Buffer) =>
            new Promise<string>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: 'job-images',
                  resource_type: 'image',
                  format: 'webp',
                  transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto:good' },
                  ],
                  public_id: `job_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                },
                (error, result) => {
                  if (error || !result)
                    return reject(
                      error || new Error('No result from Cloudinary')
                    );
                  resolve(result.secure_url);
                }
              );
              streamifier.default.createReadStream(fileBuffer).pipe(stream);
            });

          // Upload all images to Cloudinary
          const uploadPromises = (req.files as any[]).map((file: any) =>
            uploadToCloudinary(file.buffer)
          );

          const photoUrls = await Promise.all(uploadPromises);
          jobData.photos = photoUrls;
        } catch (uploadError) {
          return ApiResponse.badRequest(
            res,
            'Failed to upload images to cloud storage'
          );
        }

      console.log(
        'Final jobData before creating job:',
        JSON.stringify(jobData, null, 2)
      );

      const job = await JobService.createJob(jobData);
      return ApiResponse.success(res, job, 'Job created successfully', 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create job';
      return ApiResponse.badRequest(res, message);
    }
  }

  // GET /api/jobs
  static async getJobs(req: IAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Enhanced filters
      const filters: any = {};
      if (req.query.service) filters.service = req.query.service;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.paymentType) filters.paymentType = req.query.paymentType;
      if (req.query.state) filters.state = req.query.state;
      if (req.query.city) filters.city = req.query.city;

      const { data: jobs, pagination } =
        await JobService.getJobsWithAdvancedFilters(filters, page, limit);
      return ApiResponse.success(
        res,
        { data: jobs, pagination },
        'Jobs retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch jobs', 500);
    }
  }

  // GET /api/jobs/search?q=searchTerm
  static async searchJobs(req: IAuthenticatedRequest, res: Response) {
    try {
      const searchTerm = req.query.q as string;

      if (!searchTerm || searchTerm.trim().length === 0)
        return ApiResponse.badRequest(res, 'Search term is required');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Additional filters can still be applied
      const filters: any = {};
      if (req.query.service) filters.service = req.query.service;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.paymentType) filters.paymentType = req.query.paymentType;
      if (req.query.state)
        filters['address.state'] = { $regex: req.query.state, $options: 'i' };
      if (req.query.city)
        filters['address.city'] = { $regex: req.query.city, $options: 'i' };

      const { data: jobs, pagination } = await JobService.searchJobs(
        searchTerm.trim(),
        filters,
        page,
        limit
      );

      return ApiResponse.success(
        res,
        {
          data: jobs,
          pagination,
          searchTerm: searchTerm.trim(),
        },
        `Found ${pagination.totalItems} jobs matching "${searchTerm.trim()}"`
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to search jobs', 500);
    }
  }

  // GET /api/jobs/:jobId
  static async getJobById(req: IAuthenticatedRequest, res: Response) {
    try {
      const job = await JobService.getJobById(req.params.jobId);
      if (!job) return ApiResponse.notFound(res, 'Job not found');
      return ApiResponse.success(res, job, 'Job retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch job', 500);
    }
  }

  // PUT /api/jobs/:jobId (Client only)
  static async updateJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const job = await JobService.updateJob(
        req.params.jobId,
        new Types.ObjectId(clientId),
        req.body
      );
      if (!job)
        return ApiResponse.notFound(res, 'Job not found or not owned by user');
      return ApiResponse.success(res, job, 'Job updated successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update job';
      return ApiResponse.badRequest(res, message);
    }
  }

  // DELETE /api/jobs/:jobId (Client only)
  static async deleteJob(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const job = await JobService.deleteJob(
        req.params.jobId,
        new Types.ObjectId(clientId)
      );
      if (!job)
        return ApiResponse.notFound(res, 'Job not found or not owned by user');
      return ApiResponse.success(res, null, 'Job deleted successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete job', 500);
    }
  }

  // PATCH /api/jobs/:jobId/status
  static async updateJobStatus(req: IAuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const { status } = req.body;
      const job = await JobService.updateJobStatus(jobId, status);
      if (!job) return ApiResponse.notFound(res, 'Job not found');
      return ApiResponse.success(res, job, 'Job status updated successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update job status';
      return ApiResponse.badRequest(res, message);
    }
  }
}
