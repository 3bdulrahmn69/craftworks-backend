import { Response } from 'express';
import { ServiceService } from '../services/service.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';

export const ServiceController = {
  // GET /api/services
  async getAllServices(_req: IAuthenticatedRequest, res: Response) {
    try {
      const services = await ServiceService.getAllServices();
      return res.json({ data: services });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch services' });
    }
  },

  // POST /api/services (admin/moderator only)
  async createService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.createService(_req.body);
      return res.status(201).json({ data: service });
    } catch (error) {
      return res
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : 'Failed to create service',
        });
    }
  },

  // PUT /api/services/:id (admin/moderator only)
  async updateService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.updateService(
        _req.params.id,
        _req.body
      );
      if (!service)
        return res.status(404).json({ message: 'Service not found' });
      return res.json({ data: service });
    } catch (error) {
      return res
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : 'Failed to update service',
        });
    }
  },

  // DELETE /api/services/:id (admin/moderator only)
  async deleteService(_req: IAuthenticatedRequest, res: Response) {
    try {
      const service = await ServiceService.deleteService(_req.params.id);
      if (!service)
        return res.status(404).json({ message: 'Service not found' });
      return res.json({ message: 'Service deleted' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete service' });
    }
  },
};
