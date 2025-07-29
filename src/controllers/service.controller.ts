import { Response } from 'express';
import { ServiceService } from '../services/service.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ServiceController {
  // GET /api/services
  static async getAllServices(_req: IAuthenticatedRequest, res: Response) {
    try {
      const services = await ServiceService.getAllServices();
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
  static async createService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.createService(_req.body);
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
  static async updateService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.updateService(
        _req.params.id,
        _req.body
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
  static async deleteService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.deleteService(_req.params.id);
      if (!service) return ApiResponse.notFound(res, 'Service not found');
      return ApiResponse.success(res, null, 'Service deleted successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete service', 500);
    }
  }
}
