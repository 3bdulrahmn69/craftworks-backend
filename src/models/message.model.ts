import { Schema, model } from 'mongoose';
import { IMessage } from '../types/message.types.js';

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: String,
      required: true,
      ref: 'Chat',
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image'],
      required: true,
      default: 'text',
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000, // Max message length
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
    versionKey: false,
  }
);

// Indexes for efficient queries
messageSchema.index({ chatId: 1, timestamp: -1 }); // For getting messages in a chat
messageSchema.index({ senderId: 1, timestamp: -1 }); // For getting user's messages
messageSchema.index({ chatId: 1, isRead: 1 }); // For unread count

export default model<IMessage>('Message', messageSchema);
