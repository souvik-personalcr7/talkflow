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
      <div className="py-2 px-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium text-red-500 dark:text-red-400">
          Failed to load conversations
        </p>
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
    <div className="py-1">
      {filteredConversations.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            💬
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchTerm ? 'No matching conversations' : 'No conversations yet'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
            {searchTerm ? 'Try searching for someone else' : 'Switch to People to start a new chat'}
          </p>
        </div>
      ) : (
        <ul className="px-2 space-y-1">
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
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-150 text-left select-none ${
                    isClickable ? 'cursor-pointer' : 'opacity-70'
                  } ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs border border-indigo-100 dark:border-indigo-900/50' 
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
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
                      <div className="relative">
                        <Avatar user={otherParticipant} size="md" />
                        {otherParticipant.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                        ?
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-sm truncate mr-2 ${
                        isSelected 
                          ? 'font-bold text-indigo-950 dark:text-white' 
                          : unreadCount > 0 
                            ? 'font-bold text-slate-900 dark:text-white' 
                            : 'font-semibold text-slate-800 dark:text-slate-200'
                      }`}>
                        {displayName}
                      </p>
                      {lastMessage?.createdAt && (
                        <div className="flex items-center gap-1 flex-shrink-0 text-slate-400 dark:text-slate-500">
                          {isMuted && <BellOff className="w-3 h-3 text-slate-400" />}
                          <span className="text-[11px] font-medium">
                            {format(new Date(lastMessage.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center gap-1.5">
                      <p className={`text-xs truncate ${
                        unreadCount > 0 
                          ? 'font-semibold text-slate-900 dark:text-slate-100' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {lastMessage?.text || (otherParticipant && displayUsername !== '' ? `@${displayUsername}` : 'No messages yet')}
                      </p>
                      
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center rounded-full flex-shrink-0 shadow-xs">
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
