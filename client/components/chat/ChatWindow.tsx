'use client';

import { User, Conversation, Message } from '@/types';
import { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { socket } from '../../lib/socket';
import { Bot } from 'lucide-react';

interface ChatWindowProps {
  selectedUser: User | null;
  activeConversation?: Conversation | null;
  messages?: Message[];
  messagesLoading?: boolean;
  onSendMessage?: (text: string, options?: any) => void | Promise<any>;
  onBack: () => void;
}

export default function ChatWindow({ 
  selectedUser, 
  activeConversation = null,
  messages = [],
  messagesLoading = false,
  onSendMessage,
  onBack 
}: ChatWindowProps) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const handleTypingStart = (payload: { conversationId: string, userId: string }) => {
      if (activeConversation && payload.conversationId === activeConversation.id && payload.userId === selectedUser?.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (payload: { conversationId: string, userId: string }) => {
      if (activeConversation && payload.conversationId === activeConversation.id && payload.userId === selectedUser?.id) {
        setIsTyping(false);
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [activeConversation, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-center px-4 border-l border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">TalkFlow</h2>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">One place for every conversation.</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Select a conversation to start chatting.</p>
        <div className="flex items-center space-x-4 text-gray-400 dark:text-gray-500">
          <span className="h-px w-16 bg-gray-300 dark:bg-gray-700"></span>
          <span>or</span>
          <span className="h-px w-16 bg-gray-300 dark:bg-gray-700"></span>
        </div>
        <div className="mt-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 py-2 px-6 rounded-full font-medium transition-colors">
            <Bot size={24} />
            <span>Talk to TalkFlow AI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 h-full border-l border-gray-200 dark:border-gray-800 transition-colors">
      <ChatHeader user={selectedUser} onBack={onBack} />
      <MessageList 
        selectedUser={selectedUser} 
        activeConversation={activeConversation}
        messages={messages}
        messagesLoading={messagesLoading}
      />
      {isTyping && (
        <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 italic animate-pulse">
          {selectedUser.name} is typing...
        </div>
      )}
      <MessageInput 
        onSendMessage={onSendMessage}
        disabled={selectedUser.id === 'ai'} 
        conversationId={activeConversation?.id}
        receiverId={selectedUser.id}
      />
    </div>
  );
}
