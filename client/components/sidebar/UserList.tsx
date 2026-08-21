'use client';

import { User } from '@/types';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export default function UserList({ users, loading, error, onSelectUser, selectedUserId }: UserListProps) {
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500 text-center">{error}</div>;
  }

  if (users.length === 0) {
    return <div className="p-4 text-sm text-gray-600 text-center">No users found.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        People
      </div>
      <ul className="space-y-1 px-2">
        {users.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => onSelectUser(user)}
              className={`w-full flex items-center p-2 rounded-lg transition-colors text-left ${
                selectedUserId === user.id ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mr-3 relative">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm">
                    {getInitials(user.name)}
                  </div>
                )}
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate">@{user.username}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
