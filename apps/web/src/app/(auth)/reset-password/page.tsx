'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Loader2, BookOpen, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

const schema = z.object({
  password: z.string().min(8, 'Min 8 chars').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Need uppercase, lowercase, number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ password }: FormData) => {
    if (!token) {
      setApiError(lang === 'bn' ? 'রিসেট টোকেন পাওয়া যায়নি। লিংকটি মেয়াদোত্তীর্ণ হতে পারে।' : 'Reset token not found. The link may have expired.');
      return;
    }
    setApiError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      const raw = Array.isArray(msg) ? msg[0] : msg;
      setApiError(raw ?? (lang === 'bn' ? 'রিসেট ব্যর্থ হয়েছে। লিংকটি মেয়াদোত্তীর্ণ হতে পারে।' : 'Reset failed. The link may have expired.'));
    }
  };

  const t = {
    title:    lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password',
    subtitle: lang === 'bn' ? 'শক্তিশালী পাসওয়ার্ড ব্যবহার করুন' : 'Choose a strong password',
    password: lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password',
    confirm:  lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password',
    submit:   lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password',
    successTitle: lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন হয়েছে!' : 'Password Changed!',
    successMsg:   lang === 'bn' ? 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। লগইন পেজে নিয়ে যাওয়া হচ্ছে...' : 'Your password has been changed successfully. Redirecting to login...',
    noToken:  lang === 'bn' ? 'অবৈধ বা মেয়াদোত্তীর্ণ লিংক' : 'Invalid or expired link',
    noTokenMsg: lang === 'bn' ? 'এই রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ হয়ে গেছে।' : 'This reset link is invalid or has expired.',
    tryAgain: lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again',
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">{t.noToken}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.noTokenMsg}</p>
          <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline">{t.tryAgain}</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{t.successTitle}</h1>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t.successMsg}</p>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-900 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black tracking-tight">UNKORA</span>
        </Link>

        <div>
          <h2 className="text-white text-3xl font-black leading-tight mb-4">
            {lang === 'bn' ? 'নতুন পাসওয়ার্ড\nসেট করুন' : 'Set a New\nPassword'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {lang === 'bn'
              ? 'শক্তিশালী পাসওয়ার্ড ব্যবহার করুন — কমপক্ষে ৮ অক্ষর, একটি বড় হাতের অক্ষর, একটি ছোট হাতের অক্ষর এবং একটি সংখ্যা।'
              : 'Use a strong password — at least 8 characters with uppercase, lowercase, and a number.'}
          </p>
        </div>

        <p className="text-gray-600 text-xs">© 2025 UNKORA. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 text-lg font-black">UNKORA</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-xs text-gray-400 hover:text-primary border border-gray-200 rounded-full px-3 py-1 transition-colors"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-1">{t.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.subtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.confirm}</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? (lang === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Changing...') : t.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
