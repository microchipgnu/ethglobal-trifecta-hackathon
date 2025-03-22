import mongoose, { Schema } from 'mongoose';

// Define the interface for Message document
export interface IAppMessage {
  content: string;
  sender: string; // EVM address
  timestamp: Date;
}

// Define the schema
const appMessageSchema = new Schema<IAppMessage>({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message content cannot be more than 1000 characters'],
  },
  sender: {
    type: String,
    required: [true, 'Sender is required'],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Check if model exists before creating a new one
// This is necessary for Next.js hot reloading
export const AppMessage =
  mongoose.models.AppMessage ||
  mongoose.model<IAppMessage>('AppMessage', appMessageSchema);
