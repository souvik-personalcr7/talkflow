import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isNextSameUser?: boolean;
  isPrevSameUser?: boolean;
}

export default function MessageBubble({ message, isNextSameUser = false, isPrevSameUser = false }: MessageBubbleProps) {
  const { user } = useAuth();
  
  const currentUserId = user?.id || (user as any)?._id;
  const senderId = message.senderId || (message as any).sender?._id || (message as any).sender?.id || (message as any).sender || (message as any).userId || (message as any).from;
  
  const isOwnMessage = String(senderId) === String(currentUserId);
  
  // Spacing: compact if next message is from the same user, otherwise normal gap
  const marginBottom = isNextSameUser ? 'mb-0.5' : 'mb-3';

  // Rounded corners:
  // - If it's my message (right), sharp on top-right for the first message, rounded otherwise.
  // - If it's other user (left), sharp on top-left for the first message, rounded otherwise.
  let cornerClasses = 'rounded-2xl';
  if (isOwnMessage) {
    // Sharp top-right if previous message wasn't from the same user (i.e. it's the start of a group)
    cornerClasses = isPrevSameUser ? 'rounded-2xl' : 'rounded-2xl rounded-tr-sm';
  } else {
    // Sharp top-left if previous message wasn't from the same user
    cornerClasses = isPrevSameUser ? 'rounded-2xl' : 'rounded-2xl rounded-tl-sm';
  }

  // Colors:
  // WhatsApp Style: Sender = Green (#d9fdd3), Receiver = White (#ffffff)
  const colorClasses = isOwnMessage 
    ? 'bg-[#d9fdd3] text-gray-800 border border-green-200' 
    : 'bg-white text-gray-800 border border-gray-200 shadow-sm';

  const timeColor = isOwnMessage ? 'text-gray-500' : 'text-gray-400';

  return (
    <div 
      className={`flex w-full ${marginBottom}`}
      style={{ 
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        textAlign: isOwnMessage ? 'right' : 'left'
      }}
    >
      <div 
        className={`relative px-3.5 py-1.5 flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${cornerClasses} ${colorClasses}`}
        style={{
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          textAlign: 'left' // Reset text alignment inside the bubble
        }}
      >
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
        <div className={`text-[10px] mt-0.5 self-end flex items-center space-x-1 font-medium select-none ${timeColor}`}>
          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
          {isOwnMessage && (
            <span className="ml-1 text-gray-500">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
