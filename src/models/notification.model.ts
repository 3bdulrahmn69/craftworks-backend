import { Schema, model } from 'mongoose';
import { INotification } from '../types/notification.types.js';

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String },
  message: { type: String },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = model<INotification>(
  'Notification',
  notificationSchema
);
