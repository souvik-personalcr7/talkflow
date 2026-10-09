'use client';

import { useState, useRef, useEffect } from 'react';
import { socket } from '../../lib/socket';
import { Plus, X, File as FileIcon, ImageIcon, Contact as ContactIcon, Smile, Mic, Send } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import ContactSelector from './ContactSelector';
import { useAuth } from '@/hooks/useAuth';
import { uploadMessageImage, uploadMessageFile } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface MessageInputProps {
  onSendMessage?: (text: string, options?: any) => void;
  disabled?: boolean;
  conversationId?: string;
  receiverId?: string;
  blockStatus?: { blockedByMe: boolean; blockedByThem: boolean } | null;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '✨', '👏', '🙏', '😍', '🚀'];

export default function MessageInput({ onSendMessage, disabled = false, conversationId, receiverId, blockStatus }: MessageInputProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attachment states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'file' | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setIsEmojiOpen(false);
      }
    };
    if (isEmojiOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiOpen]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (disabled || !conversationId || !receiverId) return;

    socket.emit('typing:start', { conversationId, receiverId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, receiverId });
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset other attachments
    clearAttachments();

    setSelectedFile(file);
    setFileType(type);
    setIsMenuOpen(false);

    if (type === 'image') {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
    
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const handleContactSelect = (contact: User) => {
    clearAttachments();
    setSelectedContact(contact);
    setIsContactSelectorOpen(false);
  };

  const clearAttachments = () => {
    setSelectedFile(null);
    setFileType(null);
    setSelectedContact(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setIsEmojiOpen(false);
    textInputRef.current?.focus();
  };

  const handleMicClick = () => {
    showToast('Voice message recording activated', 'info');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled || isSending || !onSendMessage) return;
    if (!text.trim() && !selectedFile && !selectedContact) return;

    setIsSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (conversationId && receiverId) {
      socket.emit('typing:stop', { conversationId, receiverId });
    }

    try {
      let options: any = {};

      if (selectedFile) {
        if (fileType === 'image') {
          const imageUrl = await uploadMessageImage(selectedFile);
          options = { messageType: 'image', imageUrl };
        } else if (fileType === 'file') {
          const fileData = await uploadMessageFile(selectedFile);
          options = { 
            messageType: 'file', 
            attachment: {
              url: fileData.url,
              name: fileData.name,
              size: fileData.size,
              mimeType: fileData.mimeType
            } 
          };
        }
      } else if (selectedContact) {
        options = {
          messageType: 'contact',
          contact: {
            userId: selectedContact.id,
            name: selectedContact.name,
            profilePicture: selectedContact.profileImage
          }
        };
      }

      onSendMessage(text, options);
      
      // Clear inputs after sending
      setText('');
      clearAttachments();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 p-2 sm:p-3 md:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-3 md:pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex-shrink-0 z-20 w-full">
      {(blockStatus?.blockedByMe || blockStatus?.blockedByThem) ? (
        <div className="flex items-center justify-center py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {blockStatus.blockedByMe 
              ? "You blocked this user." 
              : "You can't message this user."}
          </p>
        </div>
      ) : (
        <>
          {/* Previews */}
          {(selectedFile || selectedContact) && (
            <div className="mb-2 px-1 sm:px-2">
              <div className="relative inline-flex items-center p-2 pr-9 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-full">
                {fileType === 'image' && filePreview && (
                  <img src={filePreview} alt="Preview" className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg mr-2 sm:mr-2.5 flex-shrink-0" />
                )}
                {fileType === 'file' && selectedFile && (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg mr-2 sm:mr-2.5 flex items-center justify-center flex-shrink-0">
                    <FileIcon size={18} />
                  </div>
                )}
                {selectedContact && (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg mr-2 sm:mr-2.5 flex items-center justify-center flex-shrink-0">
                    <ContactIcon size={18} />
                  </div>
                )}
                
                <div className="flex flex-col min-w-0 max-w-[150px] sm:max-w-[200px]">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {selectedFile ? selectedFile.name : selectedContact ? selectedContact.name : ''}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {fileType === 'image' ? 'Photo' : fileType === 'file' ? `${(selectedFile!.size / 1024).toFixed(1)} KB` : 'Contact card'}
                  </span>
                </div>

                <button 
                  type="button"
                  onClick={clearAttachments}
                  className="absolute top-1.5 right-1.5 p-1 bg-white dark:bg-slate-700 rounded-full shadow hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                  aria-label="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 relative w-full min-w-0">
            {/* Unified Composer Container: [ + ] [ Type a message... ] [ emoji ] [ microphone ] */}
            <div className="flex-1 min-w-0 flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-1.5 sm:px-2 py-1 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              
              {/* [ + ] Attachment Trigger */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Add attachments"
                  disabled={disabled || isSending}
                >
                  <Plus size={19} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
                </button>
                
                {isMenuOpen && (
                  <AttachmentMenu 
                    onSelectFile={() => fileInputRef.current?.click()}
                    onSelectPhoto={() => imageInputRef.current?.click()}
                    onSelectCamera={() => cameraInputRef.current?.click()}
                    onSelectContact={() => {
                      setIsMenuOpen(false);
                      setIsContactSelectorOpen(true);
                    }}
                    onClose={() => setIsMenuOpen(false)}
                  />
                )}
              </div>

              {/* Hidden file inputs */}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={(e) => handleFileSelect(e, 'file')}
              />
              <input 
                type="file" 
                accept="image/*"
                ref={imageInputRef}
                className="hidden" 
                onChange={(e) => handleFileSelect(e, 'image')}
              />
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                className="hidden" 
                onChange={(e) => handleFileSelect(e, 'image')}
              />

              {/* [ Type a message... ] Input */}
              <input
                ref={textInputRef}
                type="text"
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 bg-transparent border-none px-2 sm:px-2.5 py-1.5 sm:py-2 text-sm text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-400 caret-indigo-600 dark:caret-indigo-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Type a message..."
                disabled={disabled || isSending}
              />

              {/* [ emoji ] Button */}
              <div className="relative flex-shrink-0" ref={emojiRef}>
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                  className="p-1 sm:p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Emoji"
                  aria-label="Add emoji"
                  disabled={disabled || isSending}
                >
                  <Smile size={18} />
                </button>

                {isEmojiOpen && (
                  <div className="absolute right-0 bottom-full mb-3 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* [ microphone ] Button */}
              <button
                type="button"
                onClick={handleMicClick}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                title="Voice message"
                aria-label="Voice message"
                disabled={disabled || isSending}
              >
                <Mic size={18} />
              </button>
            </div>
            
            {/* [ send ] Button */}
            <button 
              type="submit"
              disabled={disabled || isSending || (!text.trim() && !selectedFile && !selectedContact)}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              {isSending ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              )}
            </button>
          </form>

          {isContactSelectorOpen && (
            <ContactSelector 
              currentUser={user}
              onSelect={handleContactSelect}
              onClose={() => setIsContactSelectorOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
