'use client';

import { User } from '@/types';

interface MessageListProps {
  selectedUser: User;
}

export default function MessageList({ selectedUser }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
      {selectedUser.id === 'ai' ? (
        <div className="max-w-md">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Talk to TalkFlow AI</h3>
          <p className="text-gray-500">Your AI assistant will be available soon.</p>
        </div>
      ) : (
        <div className="max-w-md">
          <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-500 mx-auto mb-4">
            💬
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">Start a conversation with {selectedUser.name}</p>
        </div>
      )}
    </div>
  );
}
