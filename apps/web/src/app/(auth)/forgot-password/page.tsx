'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2, BookOpen, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';

const schema = z.object({
  email: z.string().email('Valid email required'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: FormData) => {
    setApiError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      const raw = Array.isArray(msg) ? msg[0] : msg;
      setApiError(raw ?? (lang === 'bn' ? 'সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Something went wrong. Please try again.'));
    }
  };

  const t = {
    title:    lang === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password',
    subtitle: lang === 'bn' ? 'আপনার ইমেইলে রিসেট লিংক পাঠানো হবে' : 'We\'ll send a reset link to your email',
    email:    lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address',
    submit:   lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link',
    back:     lang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login',
    successTitle:   lang === 'bn' ? 'ইমেইল পাঠানো হয়েছে!' : 'Email Sent!',
    successMsg:     lang === 'bn' ? 'পাসওয়ার্ড রিসেটের জন্য আপনার ইমেইল চেক করুন। লিংকটি ১৫ মিনিট পর্যন্ত কার্যকর থাকবে।' : 'Check your email for the password reset link. It will be valid for 15 minutes.',
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{t.successTitle}</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{t.successMsg}</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Link>
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
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-white text-3xl font-black leading-tight mb-4">
            {lang === 'bn' ? 'পাসওয়ার্ড ভুলে\nগেছেন?' : 'Forgot Your\nPassword?'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {lang === 'bn'
              ? 'চিন্তা করবেন না। আপনার ইমেইল ঠিকানা দিন, আমরা পাসওয়ার্ড রিসেটের লিংক পাঠাব।'
              : "Don't worry. Enter your email and we'll send you a link to reset your password."}
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {isSubmitting ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : t.submit}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
