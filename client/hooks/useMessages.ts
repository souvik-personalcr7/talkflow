import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { Message } from '../types';

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic pagination state (could be expanded)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchMessages = useCallback(async (reset = false) => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    try {
      const targetPage = reset ? 1 : page;
      const res = await api.get(`/messages/${conversationId}?page=${targetPage}&limit=30`);
      
      if (res.data.success) {
        const newMessages = res.data.data.messages;
        if (reset) {
          setMessages(newMessages);
        } else {
          // Prepend older messages if we are paginating
          setMessages(prev => [...newMessages, ...prev]);
        }
        setHasMore(res.data.data.pagination.hasMore);
        setPage(targetPage + 1);
      } else {
        setError(res.data.message || 'Failed to fetch messages');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, page]);

  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      fetchMessages(true);
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!conversationId || text.trim() === '') return null;
    
    setSending(true);
    setError(null);
    try {
      const res = await api.post('/messages', { conversationId, text });
      
      if (res.data.success) {
        const sentMessage = res.data.data.message;
        // Optimistic UI: append the successfully sent message to our local state
        setMessages(prev => [...prev, sentMessage]);
        return sentMessage;
      } else {
        setError(res.data.message || 'Failed to send message');
        return null;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending message');
      return null;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    hasMore,
    fetchMessages,
    sendMessage,
  };
};
