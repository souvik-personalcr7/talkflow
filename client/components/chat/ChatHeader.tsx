'use client';

import { User } from '@/types';

interface ChatHeaderProps {
  user: User;
  onBack: () => void;
}

export default function ChatHeader({ user, onBack }: ChatHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center px-4 flex-shrink-0">
      <button 
        onClick={onBack}
        className="mr-3 md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="flex items-center flex-1">
        <div className="relative mr-3">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {user.id === 'ai' ? '🤖' : getInitials(user.name)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">{user.name}</h2>
          <div className="flex items-center text-xs text-gray-600">
            {user.id !== 'ai' && (
              <>
                <span className="truncate mr-2">@{user.username}</span>
                {user.isOnline ? (
                  <span className="flex items-center text-green-600">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-gray-500">Offline</span>
                )}
              </>
            )}
            {user.id === 'ai' && (
              <span className="flex items-center text-indigo-600 font-medium">
                Always available
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
