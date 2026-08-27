'use client';

import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { User, Message } from '@/types';
import { format } from 'date-fns';
import Avatar from '../ui/Avatar';
import { BellOff } from 'lucide-react';

interface ConversationListProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
  unreadCounts?: Record<string, number>;
  messagesByConversation?: Record<string, Message[]>;
  searchTerm?: string;
}

export default function ConversationList({ 
  onSelectUser, 
  selectedUserId, 
  unreadCounts = {},
  messagesByConversation = {},
  searchTerm = ''
}: ConversationListProps) {
  const { conversations, loading, error } = useConversations();
  const { user: currentUser } = useAuth();

  if (loading) {
    return (
      <div className="mt-4">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center animate-pulse">
          Loading conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <div className="p-4 text-sm text-red-500 dark:text-red-400 text-center">
          Failed to load conversations.
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conv => {
    const validParticipants = conv.participants || [];
    const hasOther = validParticipants.some(p => p.id !== currentUser?.id);
    if (!hasOther) return false;
    
    if (!searchTerm) return true;
    
    const otherParticipant = validParticipants.find(p => p.id !== currentUser?.id);
    const displayName = otherParticipant?.name?.toLowerCase() || '';
    const displayUsername = otherParticipant?.username?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return displayName.includes(searchLower) || displayUsername.includes(searchLower);
  });

  return (
    <div className="py-2">
      {filteredConversations.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          No conversations yet.
        </div>
      ) : (
        <ul className="mt-2 space-y-1">
          {filteredConversations.map((conv) => {
            const validParticipants = conv.participants || [];
            let otherParticipant = validParticipants.find((p) => p.id !== currentUser?.id);
            let displayName = otherParticipant?.name || 'Unknown User';
            let displayUsername = otherParticipant?.username || 'unknown';
            
            if (!otherParticipant) {
              if (validParticipants.length > 0 && validParticipants.every(p => p.id === currentUser?.id)) {
                otherParticipant = currentUser as User;
                displayName = `${currentUser?.name} (You)`;
                displayUsername = currentUser?.username || '';
              } else {
                displayName = 'Deleted User';
              }
            }

            const isClickable = otherParticipant !== undefined;
            const isSelected = otherParticipant && selectedUserId === otherParticipant.id;
            
            const unreadCount = otherParticipant ? (unreadCounts[otherParticipant.id] || 0) : 0;
            const messages = otherParticipant ? (messagesByConversation[otherParticipant.id] || []) : [];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : (conv.lastMessage ? { text: conv.lastMessage, createdAt: conv.lastMessageAt } : null);
            const isMuted = currentUser && conv.mutedBy?.includes(currentUser.id);

            return (
              <li key={conv.id}>
                <div
                  onClick={() => {
                    if (isClickable && otherParticipant) {
                      onSelectUser(otherParticipant);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-3 transition-colors ${
                    isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800' : 'opacity-70'
                  } ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isClickable && otherParticipant) {
                        onSelectUser(otherParticipant);
                      }
                    }
                  }}
                >
                  <div className="relative mr-3 flex-shrink-0">
                    {otherParticipant ? (
                      <Avatar user={otherParticipant} size="md" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                        ?
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-sm truncate mr-2 ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-900 dark:text-gray-100'}`}>
                        {displayName}
                      </p>
                      {lastMessage?.createdAt && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isMuted && <BellOff className="w-3.5 h-3.5 text-gray-400" />}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(lastMessage.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {otherParticipant && displayUsername !== '' && (
                          <span className="mr-1 opacity-70">@{displayUsername}</span>
                        )}
                        {lastMessage?.text || ''}
                      </p>
                      
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
