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

export default function ChatDashboard() {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { createOrGetConversation } = useConversations();
  const { messages, unreadCounts, sendMessage, messagesByConversation, fetchMessages } = useSocketMessages(activeConversation?.id);
  
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <h2 className="text-2xl font-bold text-gray-500 animate-pulse">Loading TalkFlow...</h2>
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden font-sans">
      <div className={`w-full md:w-80 h-full flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <Sidebar 
          onSelectUser={handleSelectUser} 
          selectedUserId={selectedUser?.id}
          unreadCounts={unreadCounts}
          messagesByConversation={messagesByConversation}
        />
      </div>

      <div className={`flex-1 h-full min-w-0 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser?.id === 'ai' ? (
          <AIChatWindow onBack={handleBack} />
        ) : (
          <ChatWindow 
            selectedUser={selectedUser}
            activeConversation={activeConversation}
            messages={messages}
            messagesLoading={messagesLoading}
            onSendMessage={(text) => {
              if (activeConversation && selectedUser) {
                sendMessage(activeConversation.id, selectedUser.id, text);
              }
            }}
            onBack={handleBack} 
          />
        )}
      </div>
    </div>
  );
}
