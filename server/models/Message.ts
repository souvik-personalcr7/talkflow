import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  text: string;
  senderType: 'user' | 'ai';
  messageType: 'text' | 'image' | 'file' | 'contact';
  imageUrl?: string;
  attachment?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  };
  contact?: {
    userId: mongoose.Types.ObjectId;
    name: string;
    profilePicture?: string;
  };
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
      default: '', // Make it optional for files without captions
    },
    senderType: {
      type: String,
      enum: ['user', 'ai'],
      default: 'user',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'contact'],
      default: 'text',
    },
    imageUrl: {
      type: String,
    },
    attachment: {
      url: String,
      name: String,
      size: Number,
      mimeType: String,
    },
    contact: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: String,
      profilePicture: String,
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
