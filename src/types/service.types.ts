import { Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
