'use client';

import { User } from '@/types';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  selectedUser: User | null;
  onBack: () => void;
}

export default function ChatWindow({ selectedUser, onBack }: ChatWindowProps) {
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center px-4 border-l border-gray-200">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">TalkFlow</h2>
        <p className="text-xl text-gray-600 mb-2">One place for every conversation.</p>
        <p className="text-gray-500 mb-8">Select someone from the sidebar to start chatting.</p>
        <div className="flex items-center space-x-4 text-gray-400">
          <span className="h-px w-16 bg-gray-300"></span>
          <span>or</span>
          <span className="h-px w-16 bg-gray-300"></span>
        </div>
        <div className="mt-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-700 py-2 px-6 rounded-full font-medium">
            <span className="text-xl">🤖</span>
            <span>Talk to TalkFlow AI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full border-l border-gray-200">
      <ChatHeader user={selectedUser} onBack={onBack} />
      <MessageList selectedUser={selectedUser} />
      <MessageInput />
    </div>
  );
}
