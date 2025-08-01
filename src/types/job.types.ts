import { Document, Types } from 'mongoose';
import { IAddress } from './user.types.js';

export type JobStatus =
  | 'Posted'
  | 'Quoted'
  | 'Hired'
  | 'On The Way'
  | 'Completed'
  | 'Disputed'
  | 'Cancelled';

export interface IJob extends Document {
  client: Types.ObjectId;
  craftsman?: Types.ObjectId | null;
  title: string;
  description: string;
  service: Types.ObjectId;
  photos: string[];
  address?: IAddress;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: JobStatus;
  paymentType: 'Escrow' | 'Cash' | 'CashProtected';
  jobPrice: number;
  platformFee: number;
  appliedCraftsmen: Types.ObjectId[]; // Track who applied to prevent multiple applications
  jobDate?: Date; // Date when the job should be performed
  hiredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
