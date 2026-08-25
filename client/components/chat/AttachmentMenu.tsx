'use client';

import { useRef, useEffect } from 'react';
import { File, Image as ImageIcon, Contact } from 'lucide-react';

interface AttachmentMenuProps {
  onSelectFile: () => void;
  onSelectPhoto: () => void;
  onSelectContact: () => void;
  onClose: () => void;
}

export default function AttachmentMenu({ onSelectFile, onSelectPhoto, onSelectContact, onClose }: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-40"
    >
      <div className="flex flex-col p-1.5">
        <button 
          onClick={onSelectFile}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-200 text-sm font-medium w-full text-left"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <File size={16} />
          </div>
          <span>File</span>
        </button>
        
        <button 
          onClick={onSelectPhoto}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-200 text-sm font-medium w-full text-left"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ImageIcon size={16} />
          </div>
          <span>Photo</span>
        </button>
        
        <button 
          onClick={onSelectContact}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-200 text-sm font-medium w-full text-left"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Contact size={16} />
          </div>
          <span>Contact</span>
        </button>
      </div>
    </div>
  );
}
