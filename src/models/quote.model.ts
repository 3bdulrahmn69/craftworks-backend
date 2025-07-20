import { Schema, model } from 'mongoose';
import { IQuote } from '../types/quote.types.js';

const quoteSchema = new Schema<IQuote>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  craftsman: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['Submitted', 'Accepted', 'Declined'],
    default: 'Submitted',
  },
  createdAt: { type: Date, default: Date.now },
});

export const Quote = model<IQuote>('Quote', quoteSchema); 