'use client';

import { User } from '@/types';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export default function UserList({ users, loading, error, onSelectUser, selectedUserId }: UserListProps) {
  const { user: currentUser } = useAuth();

  if (loading) {
    return (
      <div className="py-2 px-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
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
          {error}
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => user.id !== currentUser?.id);

  if (filteredUsers.length === 0) {
    return (
      <div className="py-12 px-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          👥
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No people found
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
          Try a different search term to find contacts
        </p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <ul className="px-2 space-y-1">
        {filteredUsers.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => onSelectUser(user)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-150 text-left cursor-pointer ${
                selectedUserId === user.id 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs border border-indigo-100 dark:border-indigo-900/50' 
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
              }`}
            >
              <div className="relative mr-3 flex-shrink-0">
                <Avatar user={user} size="md" />
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${
                    selectedUserId === user.id
                      ? 'font-bold text-indigo-950 dark:text-white'
                      : 'font-semibold text-slate-800 dark:text-slate-200'
                  }`}>
                    {user.name}
                  </p>
                  {user.isOnline && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  @{user.username}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
