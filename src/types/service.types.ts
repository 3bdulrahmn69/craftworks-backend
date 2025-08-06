import { Document } from 'mongoose';

export interface IServiceTranslation {
  en: string;
  ar: string;
}

export interface IService extends Document {
  name: IServiceTranslation;
  description: IServiceTranslation;
  image?: string; // Cloudinary URL for service image
  createdAt: Date;
  updatedAt: Date;
}
