import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Video } from 'lucide-react';
import { uploadMessageImage } from '@/lib/api';

interface CameraActionProps {
  onImageSelected: (imageUrl: string) => void;
}

export default function CameraAction({ onImageSelected }: CameraActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOpen(false);
    setIsUploading(true);

    try {
      const url = await uploadMessageImage(file);
      onImageSelected(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="relative">
      <div 
        className={`p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
          isUploading ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 animate-pulse' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
        }`}
        title="Send Image"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Camera size={18} />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 transition-colors">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
            >
              <Video size={16} className="text-gray-400 dark:text-gray-500" />
              Open Camera
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                galleryInputRef.current?.click();
              }}
            >
              <ImageIcon size={16} className="text-gray-400 dark:text-gray-500" />
              Choose from Gallery
            </button>
          </div>
        </>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
