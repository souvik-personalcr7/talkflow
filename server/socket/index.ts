import { Server } from 'socket.io';
import crypto from 'crypto';
import { AuthenticatedSocket, socketAuth } from './socketAuth';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';

// In-memory active connection tracking
// Maps userId -> count of active socket connections
const activeConnections = new Map<string, number>();

export const initializeSocket = (io: Server) => {
  // Use authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return; // Should not happen due to middleware

    const userId = user._id.toString();

    // 1. Join personal user room
    socket.join(`user:${userId}`);

    // 2. Track connection
    const currentCount = activeConnections.get(userId) || 0;
    activeConnections.set(userId, currentCount + 1);

    // 3. If this is the first connection, mark online
    if (currentCount === 0) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('user:online', { userId, isOnline: true });
      } catch (err) {
        console.error('Error marking user online:', err);
      }
    }

    // 4. Handle incoming messages (ephemeral)
    socket.on('message:send', async (payload: { conversationId: string, receiverId: string, text: string }) => {
      try {
        const { conversationId, receiverId, text } = payload;
        
        if (!conversationId || !receiverId || !text || text.trim() === '') {
          return socket.emit('message:error', { message: 'Invalid message payload' });
        }

        const trimmedText = text.trim();

        // Verify conversation is valid and sender belongs to it
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('message:error', { message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
          (p: any) => p.toString() === userId
        );

        if (!isParticipant) {
          return socket.emit('message:error', { message: 'Unauthorized access to conversation' });
        }

        // Verify receiver is in conversation
        const isValidReceiver = conversation.participants.some(
          (p: any) => p.toString() === receiverId
        );

        if (!isValidReceiver) {
          return socket.emit('message:error', { message: 'Invalid receiver for this conversation' });
        }

        // Create ephemeral message object (NOT saved to DB)
        const messageId = crypto.randomUUID();
        const newMessage = {
          id: messageId,
          conversationId,
          senderId: userId,
          receiverId,
          text: trimmedText,
          senderType: 'user',
          messageType: 'text',
          isSeen: false,
          createdAt: new Date().toISOString(),
        };

        // Emit to receiver
        io.to(`user:${receiverId}`).emit('message:new', newMessage);
        // Emit back to sender
        io.to(`user:${userId}`).emit('message:new', newMessage);
      } catch (err) {
        console.error('Error handling message:send:', err);
        socket.emit('message:error', { message: 'Server error sending message' });
      }
    });

    // 5. Handle typing indicators
    socket.on('typing:start', (payload: { conversationId: string, receiverId: string }) => {
      if (!payload.receiverId || !payload.conversationId) return;
      io.to(`user:${payload.receiverId}`).emit('typing:start', {
        conversationId: payload.conversationId,
        userId: userId
      });
    });

    socket.on('typing:stop', (payload: { conversationId: string, receiverId: string }) => {
      if (!payload.receiverId || !payload.conversationId) return;
      io.to(`user:${payload.receiverId}`).emit('typing:stop', {
        conversationId: payload.conversationId,
        userId: userId
      });
    });

    // 6. Handle disconnect
    socket.on('disconnect', async () => {
      const count = activeConnections.get(userId) || 0;
      
      if (count <= 1) {
        // Last connection closed
        activeConnections.delete(userId);
        try {
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            lastSeen 
          });
          io.emit('user:offline', { 
            userId, 
            isOnline: false,
            lastSeen: lastSeen.toISOString()
          });
        } catch (err) {
          console.error('Error marking user offline:', err);
        }
      } else {
        activeConnections.set(userId, count - 1);
      }
    });
  });
};
