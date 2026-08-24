'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

function VerifyOtpContent() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const { showToast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  useEffect(() => {
    if (!email) {
      router.replace('/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data: VerifyOtpFormData) => {
    try {
      setServerError(null);
      const res = await api.post('/auth/verify-reset-otp', { email, otp: data.otp });
      if (res.data.success) {
        showToast(res.data.message || 'OTP verified successfully', 'success');
        const resetToken = res.data.data.resetToken;
        // Proceed to reset password, pass token securely via URL for now, could also use state
        router.push(`/reset-password?token=${encodeURIComponent(resetToken)}`);
      } else {
        setServerError(res.data.message);
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Network error occurred');
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    
    setIsResending(true);
    setServerError(null);
    try {
      const res = await api.post('/auth/resend-reset-otp', { email });
      if (res.data.success) {
        showToast('A new OTP has been sent.', 'success');
        setCountdown(60);
      } else {
        setServerError(res.data.message);
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Network error occurred');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-500 font-medium">Enter the 6-digit OTP sent to:</p>
          <p className="font-semibold text-black mt-1">{email}</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input
              {...register('otp')}
              type="text"
              maxLength={6}
              className="w-full px-4 py-3 text-center tracking-[0.5em] text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="000000"
            />
            {errors.otp && <p className="mt-1 text-sm text-red-600 text-center">{errors.otp.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition duration-300 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {countdown > 0 ? (
            <p className="text-gray-500">Resend OTP in {countdown}s</p>
          ) : (
            <button 
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-black hover:underline focus:outline-none disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-gray-500 hover:text-black transition">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Loading...</p></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
