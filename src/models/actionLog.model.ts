import { Schema, model } from 'mongoose';
import { IActionLog } from '../types/actionLog.types.js';

const actionLogSchema = new Schema<IActionLog>(
  {
    userId: {
      type: String,
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
      index: true,
    },
    userName: {
      type: String,
      required: false,
    },
    userRole: {
      type: String,
      required: false,
      enum: ['client', 'craftsman', 'admin', 'moderator', 'guest'],
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'auth',
        'user_management',
        'content',
        'system',
        'security',
        'financial',
        'communication',
      ],
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
      index: true,
    },
    userAgent: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: false, // We're using our own timestamp field
    collection: 'action_logs',
  }
);

// Compound indexes for efficient querying
actionLogSchema.index({ timestamp: -1, category: 1 });
actionLogSchema.index({ userId: 1, timestamp: -1 });
actionLogSchema.index({ action: 1, timestamp: -1 });
actionLogSchema.index({ success: 1, timestamp: -1 });
actionLogSchema.index({ userRole: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - keep logs for 1 year)
actionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

export const ActionLog = model<IActionLog>('ActionLog', actionLogSchema);
