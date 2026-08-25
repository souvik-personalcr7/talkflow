import React from 'react';
import { User } from '@/types';
import { Bot, Camera } from 'lucide-react';

interface AvatarProps {
  user?: User;
  name?: string;
  profileImage?: string;
  id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onEdit?: (e?: React.MouseEvent) => void;
  previewImage?: string | null;
}

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
};

export default function Avatar({ 
  user, 
  name, 
  profileImage, 
  id,
  className = '',
  size = 'md',
  editable = false,
  onEdit,
  previewImage = null
}: AvatarProps) {
  
  const displayName = user?.name || name || 'Unknown';
  const displayImage = previewImage || user?.profileImage || (user as any)?.profilePicture || profileImage;
  const displayId = user?.id || id;
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-24 w-24 text-3xl',
  };

  const currentSizeClass = sizeClasses[size];

  const renderEditableOverlay = () => {
    if (!editable) return null;
    
    // Scale the overlay button based on avatar size
    const overlayStyles = {
      xl: { btn: 'w-8 h-8 -bottom-2 -right-2', icon: 16, plusTop: '4px', plusRight: '4px', plusSize: '11px' },
      lg: { btn: 'w-6 h-6 -bottom-1.5 -right-1.5', icon: 12, plusTop: '2px', plusRight: '2px', plusSize: '9px' },
      md: { btn: 'w-5 h-5 -bottom-1 -right-1', icon: 10, plusTop: '1px', plusRight: '1px', plusSize: '8px' },
      sm: { btn: 'w-4 h-4 -bottom-0.5 -right-0.5', icon: 8, plusTop: '0px', plusRight: '0px', plusSize: '7px' },
    };
    
    const style = overlayStyles[size];
    
    return (
      <button
        type="button"
        onClick={onEdit}
        aria-label="Change profile picture"
        title="Change profile picture"
        className={`absolute ${style.btn} flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer transition-colors`}
      >
        <Camera size={style.icon} />
      </button>
    );
  };

  if (displayId === 'ai') {
    return (
      <div className={`relative rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-sm flex-shrink-0 transition-colors ${currentSizeClass} ${className}`}>
        <Bot size={size === 'xl' ? 48 : size === 'lg' ? 24 : size === 'md' ? 20 : 16} />
      </div>
    );
  }

  if (displayImage) {
    return (
      <div className="relative inline-block flex-shrink-0">
        <div className={`relative rounded-full overflow-hidden ${currentSizeClass} ${className}`}>
          <img 
            src={displayImage} 
            alt={displayName} 
            className="w-full h-full object-cover object-center" 
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.classList.add('bg-indigo-100', 'text-indigo-700', 'flex', 'items-center', 'justify-center', 'font-bold');
              if (target.parentElement) {
                 target.parentElement.innerHTML = getInitials(displayName);
              }
            }}
          />
        </div>
        {renderEditableOverlay()}
      </div>
    );
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <div className={`relative rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold transition-colors ${currentSizeClass} ${className}`}>
        {getInitials(displayName)}
      </div>
      {renderEditableOverlay()}
    </div>
  );
}
