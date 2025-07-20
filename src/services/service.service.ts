import { Service } from '../models/service.model.js';
import { IService } from '../types/service.types.js';

export class ServiceService {
  static async getAllServices() {
    return Service.find().lean();
  }

  static async createService(data: Partial<IService>) {
    const service = new Service(data);
    await service.save();
    return service;
  }

  static async updateService(id: string, data: Partial<IService>) {
    const service = await Service.findByIdAndUpdate(id, data, { new: true });
    return service;
  }

  static async deleteService(id: string) {
    const service = await Service.findByIdAndDelete(id);
    return service;
  }
}
