'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { User } from '@/types';

export default function ChatDashboard() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!user) return null;

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden font-sans">
      {/* 
        Mobile Layout Logic:
        If a user is selected on mobile, hide the sidebar and show the chat window.
        If no user is selected, show the sidebar.
        On Desktop (md+), show both.
      */}
      
      <div className={`w-full md:w-80 h-full flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <Sidebar 
          onSelectUser={(u: User) => setSelectedUser(u)} 
          selectedUserId={selectedUser?.id}
        />
      </div>

      <div className={`flex-1 h-full min-w-0 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <ChatWindow 
          selectedUser={selectedUser} 
          onBack={() => setSelectedUser(null)} 
        />
      </div>
    </div>
  );
}
