import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  
  const isOwnMessage = message.senderId === user?.id;

  return (
    <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isOwnMessage 
            ? 'bg-black text-white rounded-br-sm' 
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="text-base leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
        <div 
          className={`text-xs mt-1 text-right flex justify-end items-center space-x-1 ${
            isOwnMessage ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
        </div>
      </div>
    </div>
  );
}
