import { Schema, model } from 'mongoose';
import { IInvitation } from '../types/invitation.types.js';

const invitationSchema = new Schema<IInvitation>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  craftsman: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

invitationSchema.index({ job: 1, craftsman: 1 }, { unique: true });

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
