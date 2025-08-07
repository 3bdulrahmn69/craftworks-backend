import { Schema, model } from 'mongoose';
import { IDispute } from '../types/dispute.types.js';

const disputeSchema = new Schema<IDispute>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    initiator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    respondent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'poor_quality',
        'no_show',
        'payment_issue',
        'behavior_issue',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    evidence: [
      {
        text: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        images: [{ type: String }], // Cloudinary URLs
        attachments: [{ type: String }], // File URLs
      },
    ],
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    resolution: {
      decision: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      refundAmount: {
        type: Number,
        min: 0,
      },
      penaltyToUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one dispute per job
disputeSchema.index({ job: 1 }, { unique: true });

// Index for admin queries
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ createdAt: -1 });

export const Dispute = model<IDispute>('Dispute', disputeSchema);
