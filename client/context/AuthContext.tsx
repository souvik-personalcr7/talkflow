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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const refreshUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
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
        setUser(res.data.data.user);
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
        setUser(res.data.data.user);
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
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
