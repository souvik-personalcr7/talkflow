'use client';

import { User, Conversation, Message } from '@/types';
import { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { socket } from '../../lib/socket';
import { Bot, Ban } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCall } from '@/contexts/CallContext';
import Avatar from '../ui/Avatar';

interface ChatWindowProps {
  selectedUser: User | null;
  activeConversation?: Conversation | null;
  messages?: Message[];
  messagesLoading?: boolean;
  onSendMessage?: (text: string, options?: any) => void | Promise<any>;
  onDeleteMessage?: (messageId: string, type: 'me' | 'everyone') => void;
  onBack: () => void;
  onConversationUpdate?: () => void;
}

export default function ChatWindow({ 
  selectedUser, 
  activeConversation = null,
  messages = [],
  messagesLoading = false,
  onSendMessage,
  onDeleteMessage,
  onBack,
  onConversationUpdate
}: ChatWindowProps) {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{ blockedByMe: boolean; blockedByThem: boolean } | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { initiateCall } = useCall();

  useEffect(() => {
    if (activeConversation && user) {
      setIsMuted(activeConversation.mutedBy?.includes(user.id) || false);
    }
  }, [activeConversation, user]);

  useEffect(() => {
    if (selectedUser && selectedUser.id !== 'ai') {
      const fetchBlockStatus = async () => {
        try {
          const res = await api.get(`/users/${selectedUser.id}/block-status`);
          setBlockStatus(res.data.data);
        } catch (error) {
          console.error('Failed to fetch block status', error);
        }
      };
      fetchBlockStatus();
    } else {
      setBlockStatus(null);
    }
  }, [selectedUser]);

  const handleBlockUser = async () => {
    if (!selectedUser || selectedUser.id === 'ai') return;
    setIsBlocking(true);
    try {
      await api.post(`/users/${selectedUser.id}/block`);
      setBlockStatus((prev) => ({ ...prev, blockedByMe: true } as any));
      setIsBlockModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser || selectedUser.id === 'ai') return;
    try {
      await api.delete(`/users/${selectedUser.id}/block`);
      setBlockStatus((prev) => ({ ...prev, blockedByMe: false } as any));
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleMute = async () => {
    if (!activeConversation) return;
    try {
      await api.post(`/conversations/${activeConversation.id}/mute`);
      setIsMuted(!isMuted);
      window.dispatchEvent(new CustomEvent('conversations:updated'));
    } catch (error) {
      console.error('Failed to toggle mute', error);
    }
  };

  useEffect(() => {
    const handleTypingStart = (payload: { conversationId: string, userId: string }) => {
      if (activeConversation && payload.conversationId === activeConversation.id && payload.userId === selectedUser?.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (payload: { conversationId: string, userId: string }) => {
      if (activeConversation && payload.conversationId === activeConversation.id && payload.userId === selectedUser?.id) {
        setIsTyping(false);
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [activeConversation, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-900 text-center px-6 transition-colors">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md mb-4">
            <Bot size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to TalkFlow
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 text-center leading-relaxed">
            One workspace for AI and human messaging. Pick a conversation from the sidebar or start an AI brainstorm session.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              ⚡ Real-time Sockets
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              ✨ Gemini AI Built-in
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-white dark:bg-slate-900 h-full max-h-full min-h-0 transition-colors relative overflow-hidden">
      {/* Center Chat Area */}
      <div className="flex-1 flex flex-col h-full max-h-full min-h-0 min-w-0 relative overflow-hidden">
        <ChatHeader 
          user={selectedUser} 
          onBack={onBack} 
          blockStatus={blockStatus}
          isMuted={isMuted}
          onBlockClick={() => setIsBlockModalOpen(true)}
          onUnblockClick={handleUnblockUser}
          onMuteClick={handleToggleMute}
          onCallClick={() => initiateCall(selectedUser.id, selectedUser.name, 'audio')}
          onVideoCallClick={() => initiateCall(selectedUser.id, selectedUser.name, 'video')}
          onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
          isInfoOpen={isInfoOpen}
        />
        <MessageList 
          selectedUser={selectedUser} 
          activeConversation={activeConversation}
          messages={messages}
          messagesLoading={messagesLoading}
          onDeleteMessage={onDeleteMessage}
        />
        {isTyping && (
          <div className="px-6 py-2 text-xs text-slate-500 dark:text-slate-400 italic animate-pulse flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>{selectedUser.name} is typing...</span>
          </div>
        )}
        <MessageInput 
          onSendMessage={onSendMessage}
          disabled={selectedUser.id === 'ai' || blockStatus?.blockedByMe || blockStatus?.blockedByThem} 
          conversationId={activeConversation?.id}
          receiverId={selectedUser.id}
          blockStatus={blockStatus}
        />
      </div>

      {/* Right Contextual Profile / Info Panel (Collapsible) */}
      {isInfoOpen && selectedUser.id !== 'ai' && (
        <div className="hidden lg:flex flex-col w-72 xl:w-80 h-full max-h-full border-l border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 overflow-y-auto flex-shrink-0 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversation Details
            </h3>
            <button
              onClick={() => setIsInfoOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close details"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex flex-col items-center text-center border-b border-slate-200/80 dark:border-slate-800">
            <div className="relative mb-3">
              <Avatar user={selectedUser} size="xl" />
              {selectedUser.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedUser.name}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              @{selectedUser.username}
            </p>
            {selectedUser.email && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedUser.email}
              </p>
            )}
            
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                selectedUser.isOnline 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {selectedUser.isOnline ? 'Online now' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 space-y-2 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
              Actions
            </p>
            
            <button
              onClick={() => initiateCall(selectedUser.id, selectedUser.name, 'audio')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Voice Call</span>
              <span className="text-slate-400">📞</span>
            </button>

            <button
              onClick={() => initiateCall(selectedUser.id, selectedUser.name, 'video')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Video Call</span>
              <span className="text-slate-400">📹</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              <span className="text-slate-400">{isMuted ? '🔔' : '🔕'}</span>
            </button>

            <div className="pt-2">
              {blockStatus?.blockedByMe ? (
                <button
                  onClick={handleUnblockUser}
                  className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                >
                  Unblock Contact
                </button>
              ) : (
                <button
                  onClick={() => setIsBlockModalOpen(true)}
                  className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  Block Contact
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Block Confirmation Modal */}
      {isBlockModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Block {selectedUser.name}?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs leading-relaxed">
              {selectedUser.name} won&apos;t be able to send you messages or start audio/video calls.
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                disabled={isBlocking}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer shadow-xs"
              >
                {isBlocking ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Block'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
