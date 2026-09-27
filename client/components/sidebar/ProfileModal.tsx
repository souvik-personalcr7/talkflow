import React, { useState, useRef } from 'react';
import { User } from '@/types';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { X, Upload, Trash2, Sun, Moon } from 'lucide-react';
import { socket } from '@/lib/socket';
import { useTheme } from '@/context/ThemeContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const isCurrentUser = currentUser?.id === user.id;

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      resetState();
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, and WEBP formats are supported', 'error');
      resetState();
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !isCurrentUser) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      const res = await api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        showToast('Profile picture updated successfully', 'success');
        await refreshUser();
        
        socket.emit('user:profile-update', { 
          profileImage: res.data.data.profilePicture.url 
        });
        
        resetState();
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to upload profile picture', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!isCurrentUser) return;
    try {
      setIsDeleting(true);
      const res = await api.delete('/users/profile-picture');
      
      if (res.data.success) {
        showToast('Profile picture removed successfully', 'success');
        await refreshUser();
        
        socket.emit('user:profile-update', { 
          profileImage: '' 
        });
        
        resetState();
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to remove profile picture', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800 transition-all scale-100">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isCurrentUser ? 'Your Profile' : 'User Profile'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isCurrentUser ? 'Manage account details & photo' : 'Contact information'}
            </p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isUploading || isDeleting} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            aria-label="Close profile modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 ring-4 ring-indigo-50 dark:ring-indigo-950/40">
              <Avatar 
                user={user} 
                size="xl" 
                className={`shadow-sm transition-colors ${isCurrentUser ? 'cursor-pointer hover:opacity-90' : ''}`} 
                editable={isCurrentUser && !previewUrl}
                onEdit={() => isCurrentUser && fileInputRef.current?.click()}
                previewImage={previewUrl}
              />
            </div>
            
            {(isUploading || isDeleting) && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full flex items-center justify-center transition-colors">
                <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {!previewUrl && (
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">@{user.username}</p>
            </div>
          )}

          {previewUrl && isCurrentUser && (
            <div className="mb-4 text-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                New Photo Selected
              </span>
            </div>
          )}

          {isCurrentUser && (
            <div className="w-full space-y-2.5">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden" 
              />
              
              {previewUrl ? (
                <div className="flex gap-2">
                  <button 
                    onClick={resetState}
                    disabled={isUploading}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-70 shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePhoto}
                    disabled={isUploading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-70 shadow-sm shadow-indigo-500/20 cursor-pointer"
                  >
                    {isUploading ? 'Saving...' : 'Save Photo'}
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isDeleting}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100/80 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-70 border border-indigo-100 dark:border-slate-700 cursor-pointer"
                  >
                    <Upload size={15} />
                    <span>Upload New Photo</span>
                  </button>

                  {user.profileImage && (
                    <button 
                      onClick={handleRemovePhoto}
                      disabled={isUploading || isDeleting}
                      className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 text-slate-600 dark:text-slate-400 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-70 cursor-pointer"
                    >
                      <Trash2 size={15} />
                      <span>{isDeleting ? 'Removing...' : 'Remove Photo'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Appearance / Theme Mode */}
          <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Appearance
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun size={14} className={theme === 'light' ? 'text-amber-500' : ''} />
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon size={14} className={theme === 'dark' ? 'text-indigo-400' : ''} />
                Dark Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
