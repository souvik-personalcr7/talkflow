import { useRef, useEffect } from 'react';
import { File, Image as ImageIcon, Contact, Camera } from 'lucide-react';

interface AttachmentMenuProps {
  onSelectFile: () => void;
  onSelectPhoto: () => void;
  onSelectCamera: () => void;
  onSelectContact: () => void;
  onClose: () => void;
}

export default function AttachmentMenu({ onSelectFile, onSelectPhoto, onSelectCamera, onSelectContact, onClose }: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full left-0 mb-3 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-40 p-1.5"
    >
      <div className="flex flex-col space-y-0.5">
        <button 
          onClick={onSelectPhoto}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 text-xs font-semibold w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ImageIcon size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Photo</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">JPG, PNG, WebP</p>
          </div>
        </button>

        <button 
          onClick={onSelectCamera}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 text-xs font-semibold w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Camera size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Camera</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Take a snapshot</p>
          </div>
        </button>

        <button 
          onClick={onSelectFile}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 text-xs font-semibold w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <File size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Document</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">PDF, DOC, ZIP</p>
          </div>
        </button>
        
        <button 
          onClick={onSelectContact}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 text-xs font-semibold w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Contact size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Contact</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Share a user card</p>
          </div>
        </button>
      </div>
    </div>
  );
}
