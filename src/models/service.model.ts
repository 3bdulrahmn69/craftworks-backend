import { Schema, model } from 'mongoose';
import { IService } from '../types/service.types.js';

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Service = model<IService>('Service', serviceSchema);
