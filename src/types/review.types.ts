import { Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  reviewer: Types.ObjectId; // The user writing the review
  reviewee: Types.ObjectId; // The user being reviewed
  rating: number; // 1-5 stars
  comment?: string;
  isVisible: boolean; // Part of double-blind logic
  counterpartReviewed: boolean; // Whether the other party has submitted their review
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewCreate {
  jobId: string;
  rating: number;
  comment?: string;
}

export interface IReviewPublic {
  id: string;
  job: string;
  reviewer: {
    id: string;
    fullName: string;
    profilePicture?: string;
    role: string;
  };
  reviewee: {
    id: string;
    fullName: string;
    profilePicture?: string;
    role: string;
  };
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IReviewResponse {
  success: boolean;
  data?: IReviewPublic | IReviewPublic[];
  message: string;
}
