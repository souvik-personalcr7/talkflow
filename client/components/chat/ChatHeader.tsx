'use client';

import { User } from '@/types';
import { Bot } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';

interface ChatHeaderProps {
  user: User;
  onBack: () => void;
}

export default function ChatHeader({ user, onBack }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 flex-shrink-0 transition-colors">
      <div className="flex items-center flex-1 min-w-0">
        <button 
          onClick={onBack}
          className="mr-3 md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative mr-3 flex-shrink-0">
          <Avatar user={user} size="md" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</h2>
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            {user.id !== 'ai' && (
              <>
                <span className="truncate mr-2">@{user.username}</span>
                {user.isOnline ? (
                  <span className="flex items-center text-green-600 dark:text-green-500">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Offline</span>
                )}
              </>
            )}
            {user.id === 'ai' && (
              <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                Always available
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 ml-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
