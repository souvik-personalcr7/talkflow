'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';
import { useRouter, usePathname } from 'next/navigation';

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
  }, []);

  const login = async (data: any) => {
    const res = await api.post('/auth/login', data);
    if (res.data.success) {
      setUser(res.data.data.user);
      router.push('/chat');
    }
    return res.data;
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) {
      setUser(res.data.data.user);
      router.push('/chat');
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <h2 className="text-2xl font-bold text-gray-500 animate-pulse">Loading TalkFlow...</h2>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
