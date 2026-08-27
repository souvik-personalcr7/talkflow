import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  blocker: mongoose.Types.ObjectId;
  blocked: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlockSchema: Schema = new Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate block entries
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const Block = mongoose.models.Block || mongoose.model<IBlock>('Block', BlockSchema);
