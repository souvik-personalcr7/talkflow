import { Server } from 'socket.io';
import crypto from 'crypto';
import { AuthenticatedSocket, socketAuth } from './socketAuth';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Block } from '../models/Block';

// In-memory active connection tracking
// Maps userId -> count of active socket connections
const activeConnections = new Map<string, number>();

// In-memory tracking of users currently in an active call (to return 'busy' status)
const busyUsers = new Set<string>();

export const initializeSocket = (io: Server) => {
  // Use authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return; // Should not happen due to middleware

    const userId = user._id.toString();

    // 1. Join personal user room
    console.log(`[SOCKET CONNECT] userId: ${userId}, socketId: ${socket.id}`);
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
    socket.on('message:send', async (payload: { 
      conversationId: string, 
      receiverId: string, 
      text?: string, 
      messageType?: 'text' | 'image' | 'file' | 'contact', 
      imageUrl?: string,
      attachment?: any,
      contact?: any
    }) => {
      try {
        const { conversationId, receiverId, text = '', messageType = 'text', imageUrl, attachment, contact } = payload;
        
        if (!conversationId || typeof conversationId !== 'string' || 
            !receiverId || typeof receiverId !== 'string') {
          return socket.emit('message:error', { message: 'Invalid message payload' });
        }

        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (trimmedText.length > 4000) {
          return socket.emit('message:error', { message: 'Message is too long' });
        }

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

        // Check if a block exists between sender and receiver
        const blockExists = await Block.findOne({
          $or: [
            { blocker: userId, blocked: receiverId },
            { blocker: receiverId, blocked: userId }
          ]
        });

        if (blockExists) {
          return socket.emit('message:error', { message: 'Cannot send message. A block is active.' });
        }

        // Save message to MongoDB
        const savedMessage = await Message.create({
          senderId: userId,
          receiverId,
          conversationId,
          text: trimmedText,
          senderType: 'user',
          messageType,
          imageUrl,
          attachment,
          contact,
          isSeen: false,
        });

        // Update the conversation's last message for the Recent Chats UI
        let lastMessageText = trimmedText;
        if (!lastMessageText) {
          if (messageType === 'image') lastMessageText = '📷 Photo';
          else if (messageType === 'file') lastMessageText = '📄 File';
          else if (messageType === 'contact') lastMessageText = '👤 Contact';
        }

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: lastMessageText,
          lastMessageAt: new Date()
        });

        // Format for emission
        const newMessage = {
          id: savedMessage._id.toString(),
          conversationId: savedMessage.conversationId.toString(),
          senderId: savedMessage.senderId.toString(),
          receiverId: savedMessage.receiverId.toString(),
          text: savedMessage.text,
          senderType: savedMessage.senderType,
          messageType: savedMessage.messageType,
          imageUrl: savedMessage.imageUrl,
          attachment: savedMessage.attachment,
          contact: savedMessage.contact,
          isSeen: savedMessage.isSeen,
          createdAt: savedMessage.createdAt.toISOString(),
          updatedAt: savedMessage.updatedAt.toISOString(),
        };

        console.log(`[CHAT SEND] sender: ${userId}, receiver: ${receiverId}, text: ${trimmedText}`);

        // Emit to receiver
        console.log(`[CHAT ROUTE] receiverId: ${receiverId}, socketId: user:${receiverId}`);
        io.to(`user:${receiverId}`).emit('message:new', newMessage);
        console.log(`[CHAT DELIVERED] receiverId: ${receiverId}, socketId: user:${receiverId}`);
        // Emit back to sender
        io.to(`user:${userId}`).emit('message:new', newMessage);
      } catch (err) {
        console.error('Error handling message:send:', err);
        socket.emit('message:error', { message: 'Server error sending message' });
      }
    });

    // 4.5 Handle message deletion (for everyone)
    socket.on('message:delete', async (payload: {
      messageId: string,
      conversationId: string,
      receiverId: string
    }) => {
      try {
        const { messageId, conversationId, receiverId } = payload;
        
        if (!messageId || !conversationId || !receiverId) return;
        
        // Broadcast to receiver
        io.to(`user:${receiverId}`).emit('message:deleted', {
          messageId,
          conversationId
        });
        
      } catch (err) {
        console.error('Error handling message:delete:', err);
      }
    });

    // 5. Handle typing indicators
    socket.on('typing:start', (payload: { conversationId: string, receiverId: string }) => {
      if (!payload || typeof payload !== 'object' || !payload.receiverId || !payload.conversationId) return;
      io.to(`user:${payload.receiverId}`).emit('typing:start', {
        conversationId: payload.conversationId,
        userId: userId
      });
    });

    socket.on('typing:stop', (payload: { conversationId: string, receiverId: string }) => {
      if (!payload || typeof payload !== 'object' || !payload.receiverId || !payload.conversationId) return;
      io.to(`user:${payload.receiverId}`).emit('typing:stop', {
        conversationId: payload.conversationId,
        userId: userId
      });
    });

    socket.on('user:profile-update', (payload: { profileImage: string }) => {
      // Broadcast to all clients that this user updated their profile picture
      io.emit('user:profile-update', {
        userId,
        profileImage: payload?.profileImage || ''
      });
    });

    // 6. Handle WebRTC Calls
    socket.on('call:initiate', async (payload: { receiverId: string, type: 'audio' | 'video' }) => {
      try {
        const { receiverId, type } = payload;
        
        if (!receiverId || !type) return;

        // Check if caller is already busy
        if (busyUsers.has(userId)) {
          return socket.emit('call:error', { message: 'You are already in a call.' });
        }

        // Check if receiver is online
        const receiverActiveCount = activeConnections.get(receiverId) || 0;
        if (receiverActiveCount === 0) {
          return socket.emit('call:unavailable', { message: 'User is offline.' });
        }

        // Check if receiver is busy
        if (busyUsers.has(receiverId)) {
          return socket.emit('call:busy', { message: 'User is currently busy.' });
        }

        // Check if a block exists between sender and receiver
        const blockExists = await Block.findOne({
          $or: [
            { blocker: userId, blocked: receiverId },
            { blocker: receiverId, blocked: userId }
          ]
        });

        if (blockExists) {
          return socket.emit('call:error', { message: 'Call unavailable because this user is blocked.' });
        }

        // Forward to receiver
        io.to(`user:${receiverId}`).emit('call:incoming', {
          callerId: userId,
          callerName: user.name, // send name for UI
          type
        });

      } catch (err) {
        console.error('Error handling call:initiate:', err);
      }
    });

    socket.on('call:accept', (payload: { callerId: string }) => {
      const { callerId } = payload;
      if (!callerId) return;

      // Mark both as busy
      busyUsers.add(userId);
      busyUsers.add(callerId);

      io.to(`user:${callerId}`).emit('call:accepted', {
        receiverId: userId
      });
    });

    socket.on('call:decline', (payload: { callerId: string }) => {
      const { callerId } = payload;
      if (!callerId) return;

      // Ensure they are not marked busy if declined
      busyUsers.delete(userId);
      
      io.to(`user:${callerId}`).emit('call:declined', {
        receiverId: userId
      });
    });

    socket.on('call:end', (payload: { otherUserId: string }) => {
      const { otherUserId } = payload;
      
      // Remove both from busy set
      busyUsers.delete(userId);
      if (otherUserId) {
        busyUsers.delete(otherUserId);
        io.to(`user:${otherUserId}`).emit('call:ended', {
          userId
        });
      }
    });

    // WebRTC Signaling Relays
    socket.on('call:offer', (payload: { receiverId: string, offer: RTCSessionDescriptionInit }) => {
      const { receiverId, offer } = payload;
      if (receiverId && offer) {
        io.to(`user:${receiverId}`).emit('call:offer', { callerId: userId, offer });
      }
    });

    socket.on('call:answer', (payload: { callerId: string, answer: RTCSessionDescriptionInit }) => {
      const { callerId, answer } = payload;
      if (callerId && answer) {
        io.to(`user:${callerId}`).emit('call:answer', { receiverId: userId, answer });
      }
    });

    socket.on('call:ice-candidate', (payload: { targetId: string, candidate: RTCIceCandidateInit }) => {
      const { targetId, candidate } = payload;
      if (targetId && candidate) {
        io.to(`user:${targetId}`).emit('call:ice-candidate', { senderId: userId, candidate });
      }
    });

    // 7. Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`[SOCKET DISCONNECT] userId: ${userId}, socketId: ${socket.id}`);
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

      // Cleanup busy state and notify peer if disconnected during a call
      if (busyUsers.has(userId)) {
        busyUsers.delete(userId);
        // Ideally, we'd know who they were talking to and notify them to end the call.
        // For now, the client WebRTC connection will drop (iceConnectionState -> disconnected) 
        // which the frontend will catch to end the call locally.
        // Broadcasting to everyone they are offline helps the other party too.
      }
    });
  });
};
