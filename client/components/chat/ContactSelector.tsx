'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import api from '@/lib/api';
import Avatar from '../ui/Avatar';
import { X, Search } from 'lucide-react';

interface ContactSelectorProps {
  onSelect: (user: User) => void;
  onClose: () => void;
  currentUser: User | null;
}

export default function ContactSelector({ onSelect, onClose, currentUser }: ContactSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/search?q=');
        if (response.data.success) {
          setUsers(response.data.data.users);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Share Contact</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="text-center p-8 text-gray-500 animate-pulse">Loading contacts...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No contacts found.</div>
          ) : (
            <ul className="space-y-1">
              {filteredUsers.map(user => (
                <li key={user.id}>
                  <button
                    onClick={() => onSelect(user)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Avatar user={user} size="md" />
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
