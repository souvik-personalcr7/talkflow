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
      <div className="mt-4">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center animate-pulse">
          Loading people...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <div className="p-4 text-sm text-red-500 dark:text-red-400 text-center">
          {error}
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => user.id !== currentUser?.id);

  if (filteredUsers.length === 0) {
    return (
      <div className="mt-4">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          No people found.
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ul className="space-y-1">
        {filteredUsers.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => onSelectUser(user)}
              className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                selectedUserId === user.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
              }`}
            >
              <div className="relative mr-3 flex-shrink-0">
                <Avatar user={user} size="md" />
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="truncate">@{user.username}</span>
                  {user.isOnline && (
                    <span className="ml-2 flex items-center text-green-600 dark:text-green-500 font-medium flex-shrink-0">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                      Online
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
