'use client';

import { User as UserType } from '@/types';
import { Bot, EllipsisVertical, User as UserIcon, Ban, BellOff, Bell, Phone, Video } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';

interface ChatHeaderProps {
  user: UserType;
  onBack: () => void;
  blockStatus?: { blockedByMe: boolean; blockedByThem: boolean } | null;
  onBlockClick?: () => void;
  onUnblockClick?: () => void;
  isMuted?: boolean;
  onMuteClick?: () => void;
  onCallClick?: () => void;
  onVideoCallClick?: () => void;
}

export default function ChatHeader({ user, onBack, blockStatus, onBlockClick, onUnblockClick, isMuted, onMuteClick, onCallClick, onVideoCallClick }: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);
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
      
      <div className="flex-shrink-0 ml-2 flex items-center gap-2">
        <ThemeToggle />
        
        {user.id !== 'ai' && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Chat options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <EllipsisVertical className="w-5 h-5" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCallClick?.();
                  }}
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>Call</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onVideoCallClick?.();
                  }}
                >
                  <Video className="w-4 h-4 text-gray-400" />
                  <span>Video Call</span>
                </button>
                
                {blockStatus?.blockedByMe ? (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onUnblockClick?.();
                    }}
                  >
                    <Ban className="w-4 h-4 text-gray-400" />
                    <span>Unblock {user.name}</span>
                  </button>
                ) : (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onBlockClick?.();
                    }}
                  >
                    <Ban className="w-4 h-4" />
                    <span>Block {user.name}</span>
                  </button>
                )}

                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMuteClick?.();
                  }}
                >
                  {isMuted ? (
                    <>
                      <Bell className="w-4 h-4 text-gray-400" />
                      <span>Unmute Notifications</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 text-gray-400" />
                      <span>Mute Notifications</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
