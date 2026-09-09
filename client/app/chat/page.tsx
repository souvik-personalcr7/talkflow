'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import AIChatWindow from '@/components/chat/AIChatWindow';
import { User, Conversation } from '@/types';
import { useConversations } from '@/hooks/useConversations';
import { useSocketMessages } from '@/hooks/useSocketMessages';
import { useSocket } from '@/hooks/useSocket';
import { CallProvider } from '@/contexts/CallContext';
import CallModal from '@/components/calls/CallModal';

export default function ChatDashboard() {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { createOrGetConversation } = useConversations();
  const { messages, unreadCounts, sendMessage, deleteMessage, messagesByConversation, fetchMessages } = useSocketMessages(activeConversation?.id);
  
  // Initialize socket connection
  useSocket();

  const handleSelectUser = async (u: User) => {
    setSelectedUser(u);
    if (u.id === 'ai') {
      setActiveConversation(null);
      return;
    }
    setMessagesLoading(true);
    const conv = await createOrGetConversation(u.id);
    setActiveConversation(conv);
    if (conv) {
      await fetchMessages(u.id, conv.id);
    }
    setMessagesLoading(false);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setActiveConversation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors p-4">
        <div className="w-10 h-10 border-3 border-indigo-200 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">TalkFlow</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Connecting to server...</p>
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <CallProvider>
      <div className="h-screen h-[100dvh] max-h-screen w-full flex bg-gray-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors relative">
        <CallModal />
        
        <div className={`w-full md:w-80 h-full max-h-full flex-shrink-0 flex flex-col overflow-hidden ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <Sidebar 
            onSelectUser={handleSelectUser} 
            selectedUserId={selectedUser?.id}
            unreadCounts={unreadCounts}
            messagesByConversation={messagesByConversation}
          />
        </div>

        <div className={`flex-1 h-full max-h-full min-w-0 min-h-0 flex-col overflow-hidden ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser?.id === 'ai' ? (
          <AIChatWindow onBack={handleBack} />
        ) : (
          <ChatWindow 
            selectedUser={selectedUser}
            activeConversation={activeConversation}
            messages={messages}
            messagesLoading={messagesLoading}
            onSendMessage={(text, options) => {
              if (activeConversation && selectedUser) {
                sendMessage(activeConversation.id, selectedUser.id, text, options);
              }
            }}
            onDeleteMessage={(messageId, type) => {
              if (activeConversation && selectedUser) {
                deleteMessage(messageId, activeConversation.id, selectedUser.id, type);
              }
            }}
            onBack={handleBack} 
          />
        )}
      </div>
    </div>
    </CallProvider>
  );
}
