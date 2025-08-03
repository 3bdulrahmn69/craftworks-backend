import { Schema, model } from 'mongoose';
import { IChat } from '../types/message.types.js';

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: String,
        ref: 'User',
        required: true,
      },
    ],
    jobId: {
      type: String,
      ref: 'Job',
      index: true,
    },
    lastMessage: {
      type: String,
      maxlength: 500, // Truncated version for preview
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageSenderId: {
      type: String,
      ref: 'User',
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient queries
chatSchema.index({ participants: 1 }); // For finding user's chats
chatSchema.index({ jobId: 1 }); // For finding job-related chats
chatSchema.index({ lastMessageAt: -1 }); // For sorting chats by recent activity
chatSchema.index({ participants: 1, lastMessageAt: -1 }); // Compound index for user's recent chats

// Ensure only two participants per chat
chatSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    const error = new Error('A chat must have exactly 2 participants');
    return next(error);
  }
  next();
});

// Ensure participants are unique
chatSchema.pre('save', function (next) {
  const uniqueParticipants = [...new Set(this.participants)];
  if (uniqueParticipants.length !== this.participants.length) {
    const error = new Error('Participants must be unique');
    return next(error);
  }
  next();
});

export default model<IChat>('Chat', chatSchema);
