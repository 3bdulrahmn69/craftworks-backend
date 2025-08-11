import { Document, Types } from 'mongoose';
import { IAddress } from './user.types.js';

export type JobStatus =
  | 'Posted'
  | 'Hired'
  | 'On The Way'
  | 'Completed'
  | 'Disputed'
  | 'Cancelled'
  | 'Rescheduled';

export interface IJob extends Document {
  client: Types.ObjectId;
  craftsman?: Types.ObjectId | null;
  title: string;
  description: string;
  service: Types.ObjectId;
  photos: string[];
  address: IAddress; // Required now
  location: {
    type: 'Point';
    coordinates: [number, number];
  }; // Required now
  status: JobStatus;
  paymentType: 'cash' | 'visa'; // Updated payment methods
  jobPrice: number;
  platformFee: number;
  appliedCraftsmen: Types.ObjectId[]; // Track who applied to prevent multiple applications
  jobDate: Date; // Required now
  hiredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
