'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <h2 className="text-2xl font-bold text-gray-500 animate-pulse">Loading TalkFlow...</h2>
      </div>
    );
  }

  if (user) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900 px-4">
      <LoginForm />
    </div>
  );
}
