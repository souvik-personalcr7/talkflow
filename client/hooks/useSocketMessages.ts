import { useState, useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';
import { Message } from '../types';
import api from '../lib/api';

export const useSocketMessages = (activeConversationId?: string) => {
  // Store messages per conversation in frontend memory only
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  
  // Track temporary unread counts per conversation
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      const convId = newMessage.conversationId;
      
      setMessagesByConversation(prev => {
        const currentMessages = prev[convId] || [];
        
        // Basic check to avoid duplicates if React strict mode or network glitch sends same msg twice
        if (currentMessages.some(m => m.id === newMessage.id)) {
          return prev;
        }

        // Keep a reasonable limit per conversation to prevent memory bloat (e.g. 100 messages)
        const updatedMessages = [...currentMessages, newMessage];
        if (updatedMessages.length > 100) {
          updatedMessages.shift();
        }

        return { ...prev, [convId]: updatedMessages };
      });

      // Update unread count if this isn't the currently active conversation
      if (convId !== activeConversationId) {
        setUnreadCounts(prev => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1
        }));
      }
    };

    const handleMessageDeleted = (payload: { messageId: string, conversationId: string }) => {
      const { messageId, conversationId } = payload;
      
      setMessagesByConversation(prev => {
        const currentMessages = prev[conversationId];
        if (!currentMessages) return prev;
        
        return {
          ...prev,
          [conversationId]: currentMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isDeletedForEveryone: true, text: '', imageUrl: '', attachment: undefined, contact: undefined } 
              : msg
          )
        };
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [activeConversationId]);

  // Clear unread count when switching to a conversation
  useEffect(() => {
    if (activeConversationId && unreadCounts[activeConversationId] > 0) {
      setUnreadCounts(prev => ({
        ...prev,
        [activeConversationId]: 0
      }));
    }
  }, [activeConversationId, unreadCounts]);

  const sendMessage = useCallback((
    conversationId: string, 
    receiverId: string, 
    text: string = '', 
    options?: {
      messageType?: 'text' | 'image' | 'file' | 'contact';
      imageUrl?: string;
      attachment?: any;
      contact?: any;
    }
  ) => {
    if (!text.trim() && !options?.imageUrl && !options?.attachment && !options?.contact) return;
    
    socket.emit('message:send', { 
      conversationId, 
      receiverId, 
      text,
      ...options
    });
  }, []);

  const deleteMessage = useCallback(async (
    messageId: string, 
    conversationId: string, 
    receiverId: string,
    type: 'me' | 'everyone'
  ) => {
    try {
      const res = await api.delete(`/messages/${messageId}`, { data: { type } });
      
      if (res.data.success) {
        if (type === 'me') {
          // Remove from local state
          setMessagesByConversation(prev => {
            const currentMessages = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: currentMessages.filter(msg => msg.id !== messageId)
            };
          });
        } else if (type === 'everyone') {
          // Update local state to show it as deleted
          setMessagesByConversation(prev => {
            const currentMessages = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: currentMessages.map(msg => 
                msg.id === messageId 
                  ? { ...msg, isDeletedForEveryone: true, text: '', imageUrl: '', attachment: undefined, contact: undefined } 
                  : msg
              )
            };
          });
          // Emit socket event to notify receiver
          socket.emit('message:delete', { messageId, conversationId, receiverId });
        }
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, []);

  const clearMessages = useCallback((conversationId: string) => {
    setMessagesByConversation(prev => ({
      ...prev,
      [conversationId]: []
    }));
  }, []);

  const fetchMessages = useCallback(async (otherUserId: string, conversationId: string) => {
    try {
      const response = await api.get(`/messages/${otherUserId}`);
      if (response.data.success && response.data.data.messages) {
        setMessagesByConversation(prev => {
          // Merge fetched messages with existing ones to preserve any pending real-time messages
          // Deduplicate by message id
          const existing = prev[conversationId] || [];
          const fetched = response.data.data.messages;
          
          const combined = [...fetched, ...existing];
          // Use Map to deduplicate by id, keeping the latest one
          const uniqueMap = new Map();
          combined.forEach(msg => uniqueMap.set(msg.id, msg));
          
          const sortedAndUnique = Array.from(uniqueMap.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          return {
            ...prev,
            [conversationId]: sortedAndUnique
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  return {
    messages: activeConversationId ? (messagesByConversation[activeConversationId] || []) : [],
    unreadCounts,
    sendMessage,
    deleteMessage,
    clearMessages,
    fetchMessages,
    messagesByConversation // Expose this if needed for previews
  };
};
