import React, { useState, useRef } from 'react';
import { User } from '@/types';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { X, Upload, Trash2 } from 'lucide-react';
import { socket } from '@/lib/socket';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-800 transition-colors">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 transition-colors">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{isCurrentUser ? 'Your Profile' : 'User Profile'}</h2>
          <button onClick={handleClose} disabled={isUploading || isDeleting} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative mb-6">
            <Avatar 
              user={user} 
              size="xl" 
              className={`border-4 border-white dark:border-slate-800 shadow-md transition-colors ${isCurrentUser ? 'cursor-pointer' : ''}`} 
              editable={isCurrentUser && !previewUrl}
              onEdit={() => isCurrentUser && fileInputRef.current?.click()}
              previewImage={previewUrl}
            />
            
            {(isUploading || isDeleting) && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 rounded-full flex items-center justify-center transition-colors">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {!previewUrl && (
            <>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">@{user.username}</p>
            </>
          )}

          {previewUrl && isCurrentUser && (
            <div className="mb-4 text-center">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-1 rounded transition-colors">PREVIEW</span>
            </div>
          )}

          {isCurrentUser && (
            <div className="w-full space-y-3">
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
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePhoto}
                    disabled={isUploading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
                  >
                    Save Photo
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isDeleting}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
                  >
                    <Upload size={18} />
                    <span>Change Photo</span>
                  </button>

                  {user.profileImage && (
                    <button 
                      onClick={handleRemovePhoto}
                      disabled={isUploading || isDeleting}
                      className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
                    >
                      <Trash2 size={18} />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
