'use client';

import { Search, X } from 'lucide-react';

interface UserSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function UserSearch({ searchTerm, setSearchTerm }: UserSearchProps) {
  return (
    <div className="px-4 py-2.5">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          className="w-full pl-9.5 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-transparent focus:border-indigo-500/40 dark:focus:border-indigo-500/40 rounded-xl text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20 transition-all"
          placeholder="Search chats or people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
