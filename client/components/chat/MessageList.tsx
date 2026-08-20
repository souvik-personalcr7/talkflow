'use client';

import { useEffect, useRef } from 'react';
import { User, Message, Conversation } from '@/types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  selectedUser: User;
  activeConversation: Conversation | null;
  messages: Message[];
  messagesLoading: boolean;
}

export default function MessageList({ selectedUser, activeConversation, messages, messagesLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (selectedUser.id === 'ai') {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-md">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Talk to TalkFlow AI</h3>
          <p className="text-gray-500">Your AI assistant will be available soon.</p>
        </div>
      </div>
    );
  }

  if (messagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="max-w-md">
            <div className="h-16 w-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-500 mx-auto mb-4 shadow-sm">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">Start the conversation with {selectedUser.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
