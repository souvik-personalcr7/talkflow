'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { User, Message } from '@/types';
import UserSearch from './UserSearch';
import UserList from './UserList';
import ConversationList from './ConversationList';
import { Bot, MessageSquare, Users, Sparkles, Settings, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ProfileModal from './ProfileModal';
import ThemeToggle from '../ui/ThemeToggle';

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
  const [activeTab, setActiveTab] = useState<'chats' | 'people'>('chats');
  const isPeopleActive = activeTab === 'people' || debouncedSearchTerm.trim().length > 0;
  const { users, loading, error } = useUsers(debouncedSearchTerm, isPeopleActive);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="w-full h-full max-h-full bg-white dark:bg-slate-900 flex flex-col transition-colors overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between transition-colors flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">TalkFlow</h1>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">AI + Human Conversations</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Segmented Mode Control & AI Switch */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0 space-y-2">
        <button 
          className={`w-full flex items-center justify-between p-2.5 rounded-xl font-medium transition-all cursor-pointer border ${
            selectedUserId === 'ai' 
              ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs ring-1 ring-indigo-500/20' 
              : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800'
          }`}
          onClick={() => {
            onSelectUser({ id: 'ai', name: 'TalkFlow AI', username: 'ai', isOnline: true } as User);
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">TalkFlow AI</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Intelligent Assistant</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
            Active
          </span>
        </button>

        {/* Segmented tabs for Chats / People */}
        <div className="p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl grid grid-cols-2 gap-1 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
              activeTab === 'chats' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare size={13} />
            <span>Recent Chats</span>
          </button>
          <button 
            onClick={() => setActiveTab('people')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
              activeTab === 'people' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users size={13} />
            <span>People</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex-shrink-0">
        <UserSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      {/* Lists */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
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
            searchTerm={debouncedSearchTerm}
          />
        )}
      </div>

      {/* Footer Current User */}
      {currentUser && (
        <>
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-between transition-colors flex-shrink-0 mt-auto sticky bottom-0 z-20">
            <div 
              className="flex items-center min-w-0 cursor-pointer group flex-1 mr-2 p-1 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="relative mr-2.5">
                <Avatar 
                  user={currentUser} 
                  size="sm" 
                  className="ring-2 ring-transparent group-hover:ring-indigo-300 dark:group-hover:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  @{currentUser.username}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
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
