import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { otherUserId } = req.params;

    if (!currentUserId || !otherUserId) {
      res.status(400).json({ success: false, message: 'Missing user ID' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId as string)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId as string);
    if (!otherUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Find the private conversation between these two users
    const conversation = await Conversation.findOne({
      type: 'private',
      $and: [
        { participants: { $size: 2 } },
        { participants: { $all: [currentUserId, new mongoose.Types.ObjectId(otherUserId as string)] } }
      ]
    });

    if (!conversation) {
      // If no conversation exists, return empty array rather than error
      res.status(200).json({
        success: true,
        data: {
          messages: []
        }
      });
      return;
    }

    // Fetch messages for this conversation
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(500); // Limit to prevent massive payloads

    // Format to match the client's expected Message interface
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      senderType: msg.senderType,
      messageType: msg.messageType,
      isSeen: msg.isSeen,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: formattedMessages
      }
    });
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
