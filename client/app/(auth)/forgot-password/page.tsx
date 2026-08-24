'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Bot } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setServerError(null);
      const res = await api.post('/auth/forgot-password', data);
      if (res.data.success) {
        showToast(res.data.message || 'OTP sent successfully', 'success');
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        setServerError(res.data.message);
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Network error occurred');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">TalkFlow</h1>
          </div>
          <p className="text-gray-500 font-medium">Forgot Password</p>
        </div>

        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter your registered email address and we'll send you a verification code.
        </p>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition duration-300 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-black hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
