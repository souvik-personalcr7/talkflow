import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  text: string;
  senderType: 'user' | 'ai';
  messageType: 'text';
  isSeen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ['user', 'ai'],
      default: 'user',
    },
    messageType: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
