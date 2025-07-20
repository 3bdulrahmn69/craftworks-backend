import { Document, Types } from 'mongoose';

export interface IInvitation extends Document {
  job: Types.ObjectId;
  craftsman: Types.ObjectId;
  status: 'Pending' | 'Accepted' | 'Rejected';
  respondedAt?: Date;
  createdAt: Date;
}
