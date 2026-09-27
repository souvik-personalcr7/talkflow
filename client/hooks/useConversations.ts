import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { Conversation, User } from '../types';
import { socket } from '../lib/socket';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/conversations');
      if (res.data.success) {
        const convList = res.data.data.conversations;
        setConversations(convList);
        if (typeof window !== 'undefined') {
          localStorage.setItem('talkflow_cached_conversations', JSON.stringify(convList));
        }
      } else {
        setError(res.data.message || 'Failed to fetch conversations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrGetConversation = async (receiverId: string): Promise<Conversation | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/conversations', { receiverId });
      if (res.data.success) {
        const conversation = res.data.data.conversation;
        // Optionally fetch conversations again to update the list, or manually prepend
        await fetchConversations();
        return conversation;
      } else {
        setError(res.data.message || 'Failed to create conversation');
        return null;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating conversation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('talkflow_cached_conversations');
        if (cached) {
          setConversations(JSON.parse(cached));
        } else {
          setLoading(true);
        }
      }
    } catch (_) {
      setLoading(true);
    }

    fetchConversations();

    const handleProfileUpdate = (payload: { userId: string; profileImage: string }) => {
      setConversations(prev => prev.map(conv => {
        const hasParticipant = conv.participants.some(p => p.id === payload.userId);
        if (hasParticipant) {
          return {
            ...conv,
            participants: conv.participants.map(p => 
              p.id === payload.userId ? { ...p, profileImage: payload.profileImage } : p
            )
          };
        }
        return conv;
      }));
    };

    const handleConversationsUpdated = () => {
      fetchConversations();
    };

    socket.on('user:profile-update', handleProfileUpdate);
    window.addEventListener('conversations:updated', handleConversationsUpdated);

    return () => {
      socket.off('user:profile-update', handleProfileUpdate);
      window.removeEventListener('conversations:updated', handleConversationsUpdated);
    };
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    createOrGetConversation,
  };
};
