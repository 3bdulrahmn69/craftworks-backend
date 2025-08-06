import { Schema, model } from 'mongoose';
import { IJob } from '../types/job.types.js';

const jobSchema = new Schema<IJob>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    craftsman: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    photos: [{ type: String }], // Not required
    address: {
      country: { type: String, trim: true, required: true },
      state: { type: String, trim: true, required: true },
      city: { type: String, trim: true, required: true },
      street: { type: String, trim: true, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coordinates: number[]) {
            return coordinates && coordinates.length === 2;
          },
          message:
            'Location coordinates must be an array of [longitude, latitude]',
        },
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
      enum: ['cash', 'visa'], // Updated payment methods
      required: true,
    },
    jobPrice: { type: Number, default: 0 }, // Set by craftsman via quotes
    platformFee: { type: Number, default: 0 },
    appliedCraftsmen: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Track applied craftsmen
    jobDate: { type: Date, required: true }, // Required: Date when the job should be performed
    hiredAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ location: '2dsphere' });

export const Job = model<IJob>('Job', jobSchema);
