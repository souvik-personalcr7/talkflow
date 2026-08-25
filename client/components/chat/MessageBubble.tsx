import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { File as FileIcon, Download, User as UserIcon } from 'lucide-react';
import Avatar from '../ui/Avatar';

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
  let cornerClasses = 'rounded-2xl';
  if (isOwnMessage) {
    cornerClasses = isPrevSameUser ? 'rounded-2xl' : 'rounded-2xl rounded-tr-sm';
  } else {
    cornerClasses = isPrevSameUser ? 'rounded-2xl' : 'rounded-2xl rounded-tl-sm';
  }

  // Colors:
  const colorClasses = isOwnMessage 
    ? 'bg-[#d9fdd3] dark:bg-emerald-700 text-gray-800 dark:text-emerald-50 border border-green-200 dark:border-emerald-900' 
    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-700 shadow-sm';

  const timeColor = isOwnMessage ? 'text-gray-500 dark:text-emerald-200' : 'text-gray-400 dark:text-gray-500';
  
  const isImage = message.messageType === 'image' && message.imageUrl;
  const isFile = message.messageType === 'file' && message.attachment;
  const isContact = message.messageType === 'contact' && message.contact;

  return (
    <div 
      className={`flex w-full ${marginBottom}`}
      style={{ 
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        textAlign: isOwnMessage ? 'right' : 'left'
      }}
    >
      <div 
        className={`relative flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${cornerClasses} ${colorClasses} ${isImage ? 'p-1' : 'px-3.5 py-2'}`}
        style={{
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          textAlign: 'left'
        }}
      >
        {isImage ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="max-w-full max-h-[300px] object-contain rounded-xl"
            />
            {message.text && (
              <p className="p-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
            )}
          </div>
        ) : isFile ? (
          <div className="flex flex-col min-w-[200px]">
            <a 
              href={message.attachment?.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center p-3 rounded-xl mb-1 ${isOwnMessage ? 'bg-[#c3f2bc] dark:bg-emerald-800/80 hover:bg-[#b0eaa8] dark:hover:bg-emerald-800' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'} transition-colors group`}
            >
              <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-300'}`}>
                <FileIcon size={24} />
              </div>
              <div className="ml-3 flex-1 overflow-hidden pr-2">
                <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{message.attachment?.name}</p>
                <p className="text-xs mt-0.5 opacity-70">
                  {message.attachment?.size ? `${(message.attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'} • {message.attachment?.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </p>
              </div>
              <Download size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400" />
            </a>
            {message.text && (
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
            )}
          </div>
        ) : isContact ? (
          <div className="flex flex-col min-w-[200px]">
            <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700/50 mb-1">
              {message.contact?.profilePicture ? (
                <img src={message.contact.profilePicture} alt={message.contact.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <UserIcon size={20} />
                </div>
              )}
              <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{message.contact?.name}</p>
                <p className="text-xs opacity-70 mt-0.5">Contact</p>
              </div>
            </div>
            {message.text && (
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap mt-1">{message.text}</p>
            )}
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
        )}
        
        <div className={`text-[10px] mt-1 self-end flex items-center space-x-1 font-medium select-none ${isImage && !message.text ? 'absolute bottom-2 right-2 bg-black/40 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm' : timeColor}`}>
          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
          {isOwnMessage && (
            <span className={`ml-1 ${isImage && !message.text ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
