import { Document, Types } from 'mongoose';

export interface IDispute extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  initiator: Types.ObjectId; // The user who started the dispute
  respondent: Types.ObjectId; // The other party in the dispute
  reason:
    | 'poor_quality'
    | 'no_show'
    | 'payment_issue'
    | 'behavior_issue'
    | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  evidence: {
    text?: string;
    images?: string[];
    attachments?: string[];
  }[];
  adminNotes?: string;
  resolution?: {
    decision: string;
    refundAmount?: number;
    penaltyToUser?: Types.ObjectId;
    resolvedBy: Types.ObjectId;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDisputeCreate {
  jobId: string;
  reason:
    | 'poor_quality'
    | 'no_show'
    | 'payment_issue'
    | 'behavior_issue'
    | 'other';
  description: string;
  evidence?: {
    text?: string;
    images?: string[];
  };
}

export interface IDisputePublic {
  id: string;
  job: {
    id: string;
    title: string;
    status: string;
  };
  initiator: {
    id: string;
    fullName: string;
    role: string;
  };
  respondent: {
    id: string;
    fullName: string;
    role: string;
  };
  reason: string;
  description: string;
  status: string;
  priority: string;
  evidence: {
    text?: string;
    images?: string[];
    attachments?: string[];
  }[];
  adminNotes?: string;
  resolution?: {
    decision: string;
    refundAmount?: number;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDisputeResponse {
  success: boolean;
  data?: IDisputePublic | IDisputePublic[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
