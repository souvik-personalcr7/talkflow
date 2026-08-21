'use client';

import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { User, Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
  unreadCounts?: Record<string, number>;
  messagesByConversation?: Record<string, Message[]>;
}

export default function ConversationList({ 
  onSelectUser, 
  selectedUserId, 
  unreadCounts = {},
  messagesByConversation = {}
}: ConversationListProps) {
  const { conversations, loading, error } = useConversations();
  const { user: currentUser } = useAuth();

  if (loading) {
    return (
      <div className="mt-4">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Chats
        </div>
        <div className="p-4 text-sm text-gray-600 text-center animate-pulse">
          Loading conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <div className="p-4 text-sm text-red-500 text-center">
          Failed to load conversations.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Recent Chats
      </div>
      
      {conversations.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 text-center">
          No conversations yet.
        </div>
      ) : (
        <ul className="mt-2 space-y-1">
          {conversations.map((conv) => {
            const otherParticipant = conv.participants.find((p) => p.id !== currentUser?.id) || conv.participants[0];
            const isSelected = otherParticipant?.id === selectedUserId;
            const unreadCount = unreadCounts[conv.id] || 0;
            const realtimeMessages = messagesByConversation[conv.id] || [];
            const lastMsgText = realtimeMessages.length > 0 ? realtimeMessages[realtimeMessages.length - 1].text : conv.lastMessage || 'Start a conversation';
            const lastMsgTime = realtimeMessages.length > 0 ? realtimeMessages[realtimeMessages.length - 1].createdAt : conv.lastMessageAt;
            
            return (
              <li key={conv.id}>
                <button
                  onClick={() => onSelectUser(otherParticipant)}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                      {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </div>
                    {otherParticipant?.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {otherParticipant?.name}
                      </p>
                      {lastMsgTime && (
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(lastMsgTime), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-gray-600'} ${unreadCount > 0 ? 'font-semibold text-gray-900' : ''}`}>
                        {lastMsgText}
                      </p>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold ml-2">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
