import { Schema, model } from 'mongoose';
import { IJob } from '../types/job.types.js';

const jobSchema = new Schema<IJob>({
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  craftsman: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  photos: [{ type: String }],
  address: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  status: {
    type: String,
    enum: ['Posted', 'Quoted', 'Hired', 'On The Way', 'Completed', 'Disputed', 'Cancelled'],
    default: 'Posted',
  },
  paymentType: {
    type: String,
    enum: ['Escrow', 'Cash', 'CashProtected'],
  },
  jobPrice: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  hiredAt: { type: Date },
  completedAt: { type: Date },
});

jobSchema.index({ location: '2dsphere' });

export const Job = model<IJob>('Job', jobSchema); 