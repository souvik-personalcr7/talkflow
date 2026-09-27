import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { File as FileIcon, Download, User as UserIcon, Trash2, Ban } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';

interface MessageBubbleProps {
  message: Message;
  isNextSameUser?: boolean;
  isPrevSameUser?: boolean;
  onDeleteMessage?: (messageId: string, type: 'me' | 'everyone') => void;
}

export default function MessageBubble({ 
  message, 
  isNextSameUser = false, 
  isPrevSameUser = false,
  onDeleteMessage
}: MessageBubbleProps) {
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
    ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700/30' 
    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 shadow-xs';

  const timeColor = isOwnMessage ? 'text-indigo-200/90' : 'text-slate-400 dark:text-slate-500';
  
  const isImage = message.messageType === 'image' && message.imageUrl;
  const isFile = message.messageType === 'file' && message.attachment;
  const isContact = message.messageType === 'contact' && message.contact;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuRef]);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEndOrMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = (type: 'me' | 'everyone') => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id, type);
    }
    setShowMenu(false);
  };

  if (message.isDeletedForEveryone) {
    return (
      <div 
        className={`flex w-full ${marginBottom}`}
        style={{ 
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          textAlign: isOwnMessage ? 'right' : 'left'
        }}
      >
        <div 
          className={`relative flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${cornerClasses} bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3.5 py-2`}
        >
          <div className="flex items-center text-gray-500 dark:text-gray-400 italic text-[15px]">
            <Ban size={16} className="mr-2 opacity-70" />
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex w-full ${marginBottom} group`}
      style={{ 
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        textAlign: isOwnMessage ? 'right' : 'left'
      }}
    >
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEndOrMove}
        onTouchMove={handleTouchEndOrMove}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${cornerClasses} ${colorClasses} ${isImage ? 'p-1' : (isOwnMessage ? 'pl-3.5 pr-8 py-2' : 'pl-8 pr-3.5 py-2')}`}
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
            {message.text && !['📷 Image', '📷 Photo', '📄 File', '👤 Contact'].includes(message.text) && (
              <p className="p-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
            )}
          </div>
        ) : isFile ? (
          <div className="flex flex-col min-w-[200px]">
            <a 
              href={message.attachment?.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center p-2.5 rounded-xl mb-1 ${
                isOwnMessage 
                  ? 'bg-indigo-700/60 hover:bg-indigo-700/80 text-white border border-indigo-500/40' 
                  : 'bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
              } transition-colors group/file`}
            >
              <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'}`}>
                <FileIcon size={20} />
              </div>
              <div className="ml-2.5 flex-1 overflow-hidden pr-2">
                <p className="text-xs font-semibold truncate">{message.attachment?.name}</p>
                <p className="text-[11px] mt-0.5 opacity-75">
                  {message.attachment?.size ? `${(message.attachment.size / 1024).toFixed(1)} KB` : 'File'} • {message.attachment?.mimeType?.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                </p>
              </div>
              <Download size={16} className="opacity-60 group-hover/file:opacity-100 transition-opacity" />
            </a>
            {message.text && !['📷 Image', '📷 Photo', '📄 File', '👤 Contact'].includes(message.text) && (
              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
            )}
          </div>
        ) : isContact ? (
          <div className="flex flex-col min-w-[200px]">
            <div className="flex items-center p-2.5 border-b border-black/10 dark:border-white/10 mb-1">
              {message.contact?.profilePicture ? (
                <img src={message.contact.profilePicture} alt={message.contact.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <UserIcon size={18} />
                </div>
              )}
              <div className="ml-2.5 flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate">{message.contact?.name}</p>
                <p className="text-[11px] opacity-75 mt-0.5">Contact Card</p>
              </div>
            </div>
            {message.text && !['📷 Image', '📷 Photo', '📄 File', '👤 Contact'].includes(message.text) && (
              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap mt-1">{message.text}</p>
            )}
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
        )}
        
        <div className={`text-[10px] mt-1 self-end flex items-center space-x-1 font-medium select-none ${isImage && !message.text ? 'absolute bottom-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm shadow-xs' : timeColor}`}>
          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
          {isOwnMessage && (
            <span className={`ml-1 ${isImage && !message.text ? 'text-white' : 'text-indigo-200'}`}>✓✓</span>
          )}
        </div>

        {/* Delete Menu Trigger */}
        <div 
          className={`absolute top-1 ${isOwnMessage ? 'right-1' : 'left-1'} z-10 transition-opacity ${showMenu ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`} 
          ref={menuRef}
        >
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
          
          {showMenu && (
            <div className={`absolute top-8 ${isOwnMessage ? 'right-0' : 'left-0'} z-10 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden`}>
              <button 
                onClick={() => handleDelete('me')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Delete for me
              </button>
              {isOwnMessage && (
                <button 
                  onClick={() => handleDelete('everyone')}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete for everyone
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
