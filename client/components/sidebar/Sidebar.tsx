'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';

import { useDebounce } from '@/hooks/useDebounce';
import { User, Message } from '@/types';
import UserSearch from './UserSearch';
import UserList from './UserList';
import ConversationList from './ConversationList';
import { ConnectionStatus } from '../chat/ConnectionStatus';

interface SidebarProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
  unreadCounts?: Record<string, number>;
  messagesByConversation?: Record<string, Message[]>;
}

export default function Sidebar({ onSelectUser, selectedUserId, unreadCounts, messagesByConversation }: SidebarProps) {
  const { user: currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { users, loading, error } = useUsers(debouncedSearchTerm);

  return (
    <div className="w-full md:w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col items-start justify-center gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">TalkFlow</h1>
        <ConnectionStatus />
      </div>

      {/* AI Assistant Button */}
      <div className="p-4 border-b border-gray-100">
        <button 
          className="w-full flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-700 py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
          onClick={() => {
            // Trigger AI empty state selection
            // In a real app we might set an ID like "ai" or have a separate state.
            onSelectUser({ id: 'ai', name: 'TalkFlow AI', username: 'ai', isOnline: true } as User);
          }}
        >
          <span>🤖</span>
          <span>AI Assistant</span>
        </button>
      </div>

      {/* Search */}
      <UserSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        <UserList 
          users={users} 
          loading={loading} 
          error={error} 
          onSelectUser={onSelectUser}
          selectedUserId={selectedUserId}
        />
        <ConversationList 
          onSelectUser={onSelectUser}
          selectedUserId={selectedUserId}
          unreadCounts={unreadCounts}
          messagesByConversation={messagesByConversation}
        />
      </div>

      {/* Footer Current User */}
      {currentUser && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
