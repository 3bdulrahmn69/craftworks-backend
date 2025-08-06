import { Service } from '../models/service.model.js';
import { IService } from '../types/service.types.js';

export class ServiceService {
  static async getAllServices(lang?: string) {
    const services = await Service.find().lean();

    // If language is specified, return simplified format with only that language
    if (lang && (lang === 'en' || lang === 'ar')) {
      return services.map((service) => ({
        _id: service._id,
        name: service.name[lang],
        description: service.description[lang],
        image: service.image,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      }));
    }

    // Return full multilingual data
    return services;
  }

  static async createService(data: Partial<IService>) {
    const service = new Service(data);
    await service.save();
    return service;
  }

  static async updateService(id: string, data: Partial<IService>) {
    // Handle partial updates for nested translation objects
    const updateQuery: any = {};

    if (data.name) {
      if (data.name.en) updateQuery['name.en'] = data.name.en;
      if (data.name.ar) updateQuery['name.ar'] = data.name.ar;
    }

    if (data.description) {
      if (data.description.en)
        updateQuery['description.en'] = data.description.en;
      if (data.description.ar)
        updateQuery['description.ar'] = data.description.ar;
    }

    if (data.image !== undefined) updateQuery.image = data.image;

    const service = await Service.findByIdAndUpdate(id, updateQuery, {
      new: true,
    });
    return service;
  }

  static async deleteService(id: string) {
    // Hard delete the service
    const service = await Service.findByIdAndDelete(id);
    return service;
  }

  static async getServiceById(id: string, lang?: string) {
    const service = await Service.findById(id).lean();

    if (!service) return null;

    // If language is specified, return simplified format
    if (lang && (lang === 'en' || lang === 'ar')) {
      return {
        _id: service._id,
        name: service.name[lang],
        description: service.description[lang],
        image: service.image,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    }

    return service;
  }
}
