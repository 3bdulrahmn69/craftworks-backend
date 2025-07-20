import { Document, Types } from 'mongoose';

export interface IJob extends Document {
  client: Types.ObjectId;
  craftsman?: Types.ObjectId | null;
  title: string;
  description: string;
  category: string;
  photos: string[];
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status:
    | 'Posted'
    | 'Quoted'
    | 'Hired'
    | 'On The Way'
    | 'Completed'
    | 'Disputed'
    | 'Cancelled';
  paymentType: 'Escrow' | 'Cash' | 'CashProtected';
  jobPrice: number;
  platformFee: number;
  createdAt: Date;
  hiredAt?: Date;
  completedAt?: Date;
}
