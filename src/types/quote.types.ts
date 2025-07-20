import { Document, Types } from 'mongoose';

export interface IQuote extends Document {
  job: Types.ObjectId;
  craftsman: Types.ObjectId;
  price: number;
  notes?: string;
  status: 'Submitted' | 'Accepted' | 'Declined';
  createdAt: Date;
} 