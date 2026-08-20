import mongoose from 'mongoose';
import { Conversation, IConversation } from '../models/Conversation';

export const findPrivateConversation = async (
  userAId: string,
  userBId: string
): Promise<IConversation | null> => {
  const objectIdA = new mongoose.Types.ObjectId(userAId);
  const objectIdB = new mongoose.Types.ObjectId(userBId);

  // Find a conversation that has exactly these two participants and is of type private
  const conversation = await Conversation.findOne({
    type: 'private',
    $and: [
      { participants: { $size: 2 } },
      { participants: { $all: [objectIdA, objectIdB] } }
    ]
  });

  return conversation;
};
