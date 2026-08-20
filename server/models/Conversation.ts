import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  type: 'private' | 'ai';
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['private', 'ai'],
      default: 'private',
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);
