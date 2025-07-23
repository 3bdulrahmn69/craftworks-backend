import { Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
