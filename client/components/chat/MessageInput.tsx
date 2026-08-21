'use client';

import { useState, useRef, useEffect } from 'react';
import { socket } from '../../lib/socket';

interface MessageInputProps {
  onSendMessage?: (text: string) => void;
  disabled?: boolean;
  conversationId?: string;
  receiverId?: string;
}

export default function MessageInput({ onSendMessage, disabled = false, conversationId, receiverId }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (disabled || !conversationId || !receiverId) return;

    // Emit typing start
    socket.emit('typing:start', { conversationId, receiverId });

    // Debounce typing stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, receiverId });
    }, 1500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled || isSending || !onSendMessage) return;

    setIsSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (conversationId && receiverId) {
      socket.emit('typing:stop', { conversationId, receiverId });
    }

    try {
      onSendMessage(text);
      setText('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Type a message..."
          disabled={disabled || isSending}
        />
        <button 
          type="submit"
          disabled={disabled || isSending || !text.trim()}
          className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Send message"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
