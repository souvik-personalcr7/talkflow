'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { createOrGetConversation } = useConversations();
  const { messages, unreadCounts, sendMessage, deleteMessage, messagesByConversation, fetchMessages } = useSocketMessages(activeConversation?.id);
  
  // Initialize socket connection
  useSocket();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors p-4">
        <div className="w-10 h-10 border-3 border-indigo-200 dark:border-indigo-900/60 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">TalkFlow</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Connecting to workspace...</p>
      </div>
    );
  }

  return (
    <CallProvider>
      <div className="h-screen h-[100dvh] max-h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors relative">
        <CallModal />
        
        <div className={`w-full md:w-80 lg:w-88 xl:w-96 h-full max-h-full flex-shrink-0 flex flex-col overflow-hidden border-r border-slate-200/80 dark:border-slate-800 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
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
