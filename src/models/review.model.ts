import { Schema, model } from 'mongoose';
import { IReview } from '../types/review.types.js';

const reviewSchema = new Schema<IReview>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isVisible: {
      type: Boolean,
      default: false, // Initially hidden for double-blind system
    },
    counterpartReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per job
reviewSchema.index({ job: 1, reviewer: 1 }, { unique: true });

// Index for querying reviews by reviewee (for user profiles)
reviewSchema.index({ reviewee: 1, isVisible: 1 });

export const Review = model<IReview>('Review', reviewSchema);
