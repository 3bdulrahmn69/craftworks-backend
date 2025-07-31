import { Schema, model } from 'mongoose';
import { IJob } from '../types/job.types.js';

const jobSchema = new Schema<IJob>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    craftsman: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true },
    description: { type: String, required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    photos: [{ type: String }],
    address: {
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      street: { type: String, trim: true },
    },
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
      enum: [
        'Posted',
        'Quoted',
        'Hired',
        'On The Way',
        'Completed',
        'Disputed',
        'Cancelled',
      ],
      default: 'Posted',
    },
    paymentType: {
      type: String,
      enum: ['Escrow', 'Cash', 'CashProtected'],
    },
    jobPrice: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    appliedCraftsmen: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Track applied craftsmen
    jobDate: { type: Date }, // Date when the job should be performed
    hiredAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ location: '2dsphere' });

export const Job = model<IJob>('Job', jobSchema);
