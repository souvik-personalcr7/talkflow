'use client';

import { useEffect, useRef } from 'react';
import { User, Message, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
import { Bot } from 'lucide-react';

interface MessageListProps {
  selectedUser: User;
  activeConversation: Conversation | null;
  messages: Message[];
  messagesLoading: boolean;
  onDeleteMessage?: (messageId: string, type: 'me' | 'everyone') => void;
}

export default function MessageList({ selectedUser, activeConversation, messages, messagesLoading, onDeleteMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (selectedUser.id === 'ai') {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center transition-colors">
        <div className="max-w-md">
          <div className="flex justify-center text-purple-600 dark:text-purple-400 mb-4"><Bot size={48} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Talk to TalkFlow AI</h3>
          <p className="text-gray-600 dark:text-gray-400">Ask TalkFlow AI anything.</p>
        </div>
      </div>
    );
  }

  if (messagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center space-y-4 text-gray-600 dark:text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4 md:p-6 transition-colors"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="max-w-md">
            <div className="h-16 w-16 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400 mx-auto mb-4 shadow-sm">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400">No messages yet. Start the conversation.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col pb-4">
          {messages.map((message, index) => {
            const nextMessage = messages[index + 1];
            const prevMessage = messages[index - 1];
            
            const isNextSameUser = !!(nextMessage && String(nextMessage.senderId) === String(message.senderId));
            const isPrevSameUser = !!(prevMessage && String(prevMessage.senderId) === String(message.senderId));

            return (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isNextSameUser={isNextSameUser}
                isPrevSameUser={isPrevSameUser}
                onDeleteMessage={onDeleteMessage}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
