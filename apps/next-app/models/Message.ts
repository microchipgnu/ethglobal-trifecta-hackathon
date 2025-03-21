import mongoose, { Schema } from 'mongoose';

// Define the interface for Message document
export interface IMessage {
  content: string;
  sender: string; // EVM address
  timestamp: Date;
}

// Define the schema
const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message content cannot be more than 1000 characters']
  },
  sender: {
    type: String,
    required: [true, 'Sender is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Check if model exists before creating a new one
// This is necessary for Next.js hot reloading
const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message; 