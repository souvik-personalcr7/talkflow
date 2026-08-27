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
      const res = await api.post(`/conversations/${activeConversation.id}/mute`);
      setIsMuted(!isMuted);
      // Trigger conversation list refetch
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
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-center px-4 border-l border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">TalkFlow</h2>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">One place for every conversation.</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Select a conversation to start chatting.</p>
        <div className="flex items-center space-x-4 text-gray-400 dark:text-gray-500">
          <span className="h-px w-16 bg-gray-300 dark:bg-gray-700"></span>
          <span>or</span>
          <span className="h-px w-16 bg-gray-300 dark:bg-gray-700"></span>
        </div>
        <div className="mt-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 py-2 px-6 rounded-full font-medium transition-colors">
            <Bot size={24} />
            <span>Talk to TalkFlow AI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 h-full border-l border-gray-200 dark:border-gray-800 transition-colors relative">
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
      />
      <MessageList 
        selectedUser={selectedUser} 
        activeConversation={activeConversation}
        messages={messages}
        messagesLoading={messagesLoading}
        onDeleteMessage={onDeleteMessage}
      />
      {isTyping && (
        <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 italic animate-pulse">
          {selectedUser.name} is typing...
        </div>
      )}
      <MessageInput 
        onSendMessage={onSendMessage}
        disabled={selectedUser.id === 'ai' || blockStatus?.blockedByMe || blockStatus?.blockedByThem} 
        conversationId={activeConversation?.id}
        receiverId={selectedUser.id}
        blockStatus={blockStatus}
      />
      
      {/* Block Confirmation Modal */}
      {isBlockModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Block {selectedUser.name}?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {selectedUser.name} won&apos;t be able to send you messages or interact with you.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                disabled={isBlocking}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isBlocking ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
