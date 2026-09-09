'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering the icon after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-xl text-gray-400 opacity-0 cursor-default ${className}`}
        aria-hidden="true"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all cursor-pointer flex items-center gap-2 ${className}`}
      aria-label={isDark ? "Switch to day mode" : "Switch to dark mode"}
      title={isDark ? "Switch to day mode (light)" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform duration-300 hover:rotate-90" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 hover:text-indigo-700 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {isDark ? 'Day mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
