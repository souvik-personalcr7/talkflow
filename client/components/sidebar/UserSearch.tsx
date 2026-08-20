'use client';

import { ChangeEvent } from 'react';

interface UserSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function UserSearch({ searchTerm, setSearchTerm }: UserSearchProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-colors"
          placeholder="Search people..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
}
