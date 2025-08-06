import { Response } from 'express';
import { ServiceService } from '../services/service.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { ApiResponse } from '../utils/apiResponse.js';
import cloudinary from '../utils/cloudinary.js';

export class ServiceController {
  // GET /api/services
  static async getAllServices(req: IAuthenticatedRequest, res: Response) {
    try {
      const { lang } = req.query;
      const services = await ServiceService.getAllServices(lang as string);
      return ApiResponse.success(
        res,
        services,
        'Services retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch services', 500);
    }
  }

  // POST /api/services (admin/moderator only)
  static async createService(req: IAuthenticatedRequest, res: Response) {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr } = req.body;

      // Validate required fields
      if (!nameEn || !nameAr || !descriptionEn || !descriptionAr) {
        return ApiResponse.badRequest(
          res,
          'All language fields are required: nameEn, nameAr, descriptionEn, descriptionAr'
        );
      }

      const serviceData = {
        name: { en: nameEn, ar: nameAr },
        description: { en: descriptionEn, ar: descriptionAr },
      };

      // Handle image upload if file is provided
      let imageUrl = null;
      if (req.file) {
        try {
          // Import streamifier dynamically
          const streamifier = await import('streamifier');

          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'service-images',
                resource_type: 'image',
                format: 'webp',
                transformation: [
                  { width: 400, height: 400, crop: 'fill' },
                  { quality: 'auto:good' },
                ],
                public_id: `service_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              },
              (error, result) => {
                if (error || !result) {
                  return reject(
                    error || new Error('No result from Cloudinary')
                  );
                }
                resolve(result);
              }
            );
            streamifier.default.createReadStream(req.file!.buffer).pipe(stream);
          });

          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          return ApiResponse.badRequest(
            res,
            'Failed to upload image to cloud storage'
          );
        }
      }

      if (imageUrl) {
        (serviceData as any).image = imageUrl;
      }

      const service = await ServiceService.createService(serviceData);
      return ApiResponse.success(
        res,
        service,
        'Service created successfully',
        201
      );
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error ? error.message : 'Failed to create service'
      );
    }
  }

  // PUT /api/services/:id (admin/moderator only)
  static async updateService(req: IAuthenticatedRequest, res: Response) {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr } = req.body;

      const updateData: any = {};

      // Update language fields if provided
      if (nameEn || nameAr) {
        updateData.name = {};
        if (nameEn) updateData.name.en = nameEn;
        if (nameAr) updateData.name.ar = nameAr;
      }

      if (descriptionEn || descriptionAr) {
        updateData.description = {};
        if (descriptionEn) updateData.description.en = descriptionEn;
        if (descriptionAr) updateData.description.ar = descriptionAr;
      }

      // Handle image upload if file is provided
      if (req.file) {
        try {
          const streamifier = await import('streamifier');

          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'service-images',
                resource_type: 'image',
                format: 'webp',
                transformation: [
                  { width: 400, height: 400, crop: 'fill' },
                  { quality: 'auto:good' },
                ],
                public_id: `service_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              },
              (error, result) => {
                if (error || !result) {
                  return reject(
                    error || new Error('No result from Cloudinary')
                  );
                }
                resolve(result);
              }
            );
            streamifier.default.createReadStream(req.file!.buffer).pipe(stream);
          });

          updateData.image = uploadResult.secure_url;
        } catch (uploadError) {
          return ApiResponse.badRequest(
            res,
            'Failed to upload image to cloud storage'
          );
        }
      }

      const service = await ServiceService.updateService(
        req.params.id,
        updateData
      );
      if (!service) return ApiResponse.notFound(res, 'Service not found');
      return ApiResponse.success(res, service, 'Service updated successfully');
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error ? error.message : 'Failed to update service'
      );
    }
  }

  // DELETE /api/services/:id (admin/moderator only)
  static async deleteService(req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.deleteService(req.params.id);
      if (!service) return ApiResponse.notFound(res, 'Service not found');
      return ApiResponse.success(res, null, 'Service deleted successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete service', 500);
    }
  }
}
