'use client';

import { User as UserType } from '@/types';
import { Bot, EllipsisVertical, Ban, BellOff, Bell, Phone, Video, Info, Sparkles } from 'lucide-react';
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
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
}

export default function ChatHeader({ 
  user, 
  onBack, 
  blockStatus, 
  onBlockClick, 
  onUnblockClick, 
  isMuted, 
  onMuteClick, 
  onCallClick, 
  onVideoCallClick,
  onToggleInfo,
  isInfoOpen
}: ChatHeaderProps) {
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

  const isAI = user.id === 'ai';

  return (
    <div className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 transition-colors z-10">
      <div className="flex items-center flex-1 min-w-0 mr-1 sm:mr-2">
        <button 
          onClick={onBack}
          className="mr-1 sm:mr-2 md:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative mr-2 sm:mr-3 flex-shrink-0">
          {isAI ? (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <Bot size={20} />
            </div>
          ) : (
            <div className="relative">
              <Avatar user={user} size="md" />
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {user.name}
            </h2>
            {isAI && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex-shrink-0">
                <Sparkles size={10} />
                AI Assistant
              </span>
            )}
          </div>
          
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden">
            {!isAI ? (
              <>
                <span className="truncate mr-1.5">@{user.username}</span>
                {user.isOnline ? (
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0" title="Active now">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full sm:mr-1 animate-pulse" />
                    <span className="hidden sm:inline">Active now</span>
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline flex-shrink-0">Offline</span>
                )}
              </>
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[11px] truncate">
                Always available for answers & ideas
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1.5">
        {!isAI && (
          <>
            <button
              onClick={onCallClick}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Voice call"
              aria-label="Voice call"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button
              onClick={onVideoCallClick}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Video call"
              aria-label="Video call"
            >
              <Video className="w-4 h-4" />
            </button>

            {onToggleInfo && (
              <button
                onClick={onToggleInfo}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                  isInfoOpen 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' 
                    : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Conversation details"
                aria-label="Conversation details"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none cursor-pointer"
                aria-label="More options"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <EllipsisVertical className="w-4 h-4" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <button
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMuteClick?.();
                    }}
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span>Unmute Notifications</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-slate-400" />
                        <span>Mute Notifications</span>
                      </>
                    )}
                  </button>
                  
                  {blockStatus?.blockedByMe ? (
                    <button
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onUnblockClick?.();
                      }}
                    >
                      <Ban className="w-4 h-4 text-slate-400" />
                      <span>Unblock User</span>
                    </button>
                  ) : (
                    <button
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onBlockClick?.();
                      }}
                    >
                      <Ban className="w-4 h-4 text-red-500" />
                      <span>Block User</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <ThemeToggle />
      </div>
    </div>
  );
}
