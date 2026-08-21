import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import { findPrivateConversation } from '../services/conversationService';

export const createOrGetConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user?._id;

    if (!receiverId) {
      res.status(400).json({ success: false, message: 'receiverId is required' });
      return;
    }

    if (!senderId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (senderId.toString() === receiverId.toString()) {
      res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
      return;
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({ success: false, message: 'Receiver not found' });
      return;
    }

    // Check if conversation already exists
    const existingConversation = await findPrivateConversation(senderId.toString(), receiverId.toString());
    
    if (existingConversation) {
      res.status(200).json({
        success: true,
        data: {
          conversation: {
            id: existingConversation._id,
            type: existingConversation.type,
            participants: existingConversation.participants.map((p: any) => ({
              id: p._id || p,
              name: p.name,
              username: p.username,
              email: p.email,
              profileImage: p.profileImage,
              isOnline: p.isOnline,
            })),
            lastMessage: existingConversation.lastMessage,
            lastMessageAt: existingConversation.lastMessageAt,
            createdAt: existingConversation.createdAt,
            updatedAt: existingConversation.updatedAt,
          }
        }
      });
      return;
    }

    // Create new conversation
    const newConversation = await Conversation.create({
      type: 'private',
      participants: [senderId, receiverId],
    });

    res.status(201).json({
      success: true,
      data: {
        conversation: {
          id: newConversation._id,
          type: newConversation.type,
          participants: newConversation.participants.map((p: any) => ({
            id: p._id || p,
          })),
          createdAt: newConversation.createdAt,
          updatedAt: newConversation.updatedAt,
        }
      }
    });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Find conversations where user is a participant
    // Sort by lastMessageAt descending, fallback to updatedAt
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name username email profileImage isOnline')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const formattedConversations = conversations.map((conv) => ({
      id: conv._id,
      type: conv.type,
      participants: conv.participants.map((p: any) => ({
        id: p._id,
        name: p.name,
        username: p.username,
        email: p.email,
        profileImage: p.profileImage,
        isOnline: p.isOnline
      })),
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        conversations: formattedConversations
      }
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name username email profileImage isOnline');
      
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          type: conversation.type,
          participants: conversation.participants.map((p: any) => ({
            id: p._id,
            name: p.name,
            username: p.username,
            email: p.email,
            profileImage: p.profileImage,
            isOnline: p.isOnline
          })),
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        }
      }
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
