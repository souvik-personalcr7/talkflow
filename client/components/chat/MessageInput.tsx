'use client';

import { useState, useRef, useEffect } from 'react';
import { socket } from '../../lib/socket';
import { Plus, X, File as FileIcon, ImageIcon, Contact as ContactIcon } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import ContactSelector from './ContactSelector';
import { useAuth } from '@/hooks/useAuth';
import { uploadMessageImage, uploadMessageFile } from '@/lib/api';
import { User } from '@/types';

interface MessageInputProps {
  onSendMessage?: (text: string, options?: any) => void;
  disabled?: boolean;
  conversationId?: string;
  receiverId?: string;
}

export default function MessageInput({ onSendMessage, disabled = false, conversationId, receiverId }: MessageInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attachment states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'file' | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

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
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800">
      {/* Previews */}
      {(selectedFile || selectedContact) && (
        <div className="mb-3 px-4">
          <div className="relative inline-flex items-center p-2 pr-10 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {fileType === 'image' && filePreview && (
              <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg mr-3" />
            )}
            {fileType === 'file' && selectedFile && (
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg mr-3 flex items-center justify-center">
                <FileIcon size={24} />
              </div>
            )}
            {selectedContact && (
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg mr-3 flex items-center justify-center">
                <ContactIcon size={24} />
              </div>
            )}
            
            <div className="flex flex-col max-w-[200px]">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {selectedFile ? selectedFile.name : selectedContact ? selectedContact.name : ''}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fileType === 'image' ? 'Photo' : fileType === 'file' ? `${(selectedFile!.size / 1024).toFixed(1)} KB` : 'Contact'}
              </span>
            </div>

            <button 
              type="button"
              onClick={clearAttachments}
              className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-700 rounded-full shadow hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-600 dark:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 relative w-full">
        {/* Unified Input Container */}
        <div className="flex-1 flex items-center bg-gray-100 dark:bg-slate-800 rounded-full pr-1 pl-1 transition-all focus-within:bg-white dark:focus-within:bg-slate-700 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-gray-500">
          
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none flex items-center justify-center"
              aria-label="Open attachments"
              disabled={disabled || isSending}
            >
              <Plus size={22} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
            </button>
            
            {isMenuOpen && (
              <AttachmentMenu 
                onSelectFile={() => fileInputRef.current?.click()}
                onSelectPhoto={() => imageInputRef.current?.click()}
                onSelectContact={() => {
                  setIsMenuOpen(false);
                  setIsContactSelectorOpen(true);
                }}
                onClose={() => setIsMenuOpen(false)}
              />
            )}
          </div>

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
            type="text"
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-transparent px-2 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Type a message..."
            disabled={disabled || isSending}
          />
        </div>
        
        <button 
          type="submit"
          disabled={disabled || isSending || (!text.trim() && !selectedFile && !selectedContact)}
          className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          aria-label="Send message"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-white dark:border-t-black rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
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
    </div>
  );
}
