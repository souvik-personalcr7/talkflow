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
import { Bot } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ProfileModal from './ProfileModal';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'people'>('chats');

  return (
    <div className="w-full md:w-80 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col items-start justify-center gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">TalkFlow</h1>
        </div>
        <ConnectionStatus />
      </div>

      {/* AI Assistant Button */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <button 
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
            selectedUserId === 'ai' 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700'
          }`}
          onClick={() => {
            onSelectUser({ id: 'ai', name: 'TalkFlow AI', username: 'ai', isOnline: true } as User);
          }}
        >
          <Bot size={18} />
          <span>TalkFlow AI</span>
        </button>
      </div>

      {/* Search */}
      <UserSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Tabs */}
      <div className="flex px-4 pt-2 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex-1 text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === 'chats' 
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
          }`}
        >
          Recent Chats
        </button>
        <button 
          onClick={() => setActiveTab('people')}
          className={`flex-1 text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === 'people' 
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
          }`}
        >
          People
        </button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'people' ? (
          <UserList 
            users={users} 
            loading={loading} 
            error={error} 
            onSelectUser={onSelectUser}
            selectedUserId={selectedUserId}
          />
        ) : (
          <ConversationList 
            onSelectUser={onSelectUser}
            selectedUserId={selectedUserId}
            unreadCounts={unreadCounts}
            messagesByConversation={messagesByConversation}
          />
        )}
      </div>

      {/* Footer Current User */}
      {currentUser && (
        <>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between transition-colors">
            <div 
              className="flex items-center min-w-0 cursor-pointer group flex-1 mr-2"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="relative mr-3">
                <Avatar 
                  user={currentUser} 
                  size="sm" 
                  className="ring-2 ring-transparent group-hover:ring-indigo-200 dark:group-hover:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{currentUser.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">@{currentUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={logout}
                className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <ProfileModal 
            isOpen={isProfileModalOpen} 
            onClose={() => setIsProfileModalOpen(false)} 
            user={currentUser} 
          />
        </>
      )}
    </div>
  );
}
