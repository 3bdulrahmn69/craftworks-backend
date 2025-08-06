import { Schema, model } from 'mongoose';
import { IService, IServiceTranslation } from '../types/service.types.js';

const serviceTranslationSchema = new Schema<IServiceTranslation>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: serviceTranslationSchema,
      required: true,
      validate: {
        validator: function (v: IServiceTranslation) {
          return v.en && v.ar && v.en.length > 0 && v.ar.length > 0;
        },
        message: 'Both English and Arabic names are required',
      },
    },
    description: {
      type: serviceTranslationSchema,
      required: true,
      validate: {
        validator: function (v: IServiceTranslation) {
          return v.en && v.ar && v.en.length > 0 && v.ar.length > 0;
        },
        message: 'Both English and Arabic descriptions are required',
      },
    },
    image: {
      type: String,
      validate: {
        validator: function (v: string) {
          // Basic URL validation for Cloudinary URLs
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Invalid image URL format',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
serviceSchema.index({ 'name.en': 1 });
serviceSchema.index({ 'name.ar': 1 });

// Ensure unique service names in both languages
serviceSchema.index({ 'name.en': 1 }, { unique: true });
serviceSchema.index({ 'name.ar': 1 }, { unique: true });

export const Service = model<IService>('Service', serviceSchema);
