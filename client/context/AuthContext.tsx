'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Optimistically restore cached user from localStorage to render immediately (0ms wait)
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('talkflow_user');
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return null;
  });

  // If user was cached, don't block the screen with a full-screen loading spinner
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('talkflow_user');
        if (cached) return false;
      } catch (_) {}
    }
    return true;
  });

  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const refreshUser = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        const userData = res.data.data.user;
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('talkflow_user', JSON.stringify(userData));
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('talkflow_user');
        }
      }
    } catch (error: any) {
      // Only clear user on actual 401 Unauthorized responses.
      // If it's a network timeout / offline / cold start, keep the cached user so the app doesn't crash to login!
      if (error?.response?.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('talkflow_user');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If cached user exists, validate in background without blocking screen!
    const hasCachedUser = typeof window !== 'undefined' && !!localStorage.getItem('talkflow_user');
    refreshUser(hasCachedUser);

    const handleUnauthorized = () => {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('talkflow_user');
        localStorage.removeItem('talkflow_cached_conversations');
      }
      router.push('/login');
      showToast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (data: any) => {
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.success) {
        const userData = res.data.data.user;
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('talkflow_user', JSON.stringify(userData));
        }
        router.push('/chat');
        showToast('Logged in successfully', 'success');
      }
      return res.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      }
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        const userData = res.data.data.user;
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('talkflow_user', JSON.stringify(userData));
        }
        router.push('/chat');
        showToast('Registered successfully', 'success');
      }
      return res.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('talkflow_user');
        localStorage.removeItem('talkflow_cached_conversations');
      }
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
