'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff, Loader2, Recycle, ArrowRight, BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { saveUserRole } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

function RecommerceLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const qc = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/recommerce/dashboard');
    }
  }, [isAuthenticated, router, redirectTo]);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const { user } = await authApi.login(data.email, data.password);
      setUser(user);
      saveUserRole(user.role);
      void qc.invalidateQueries({ queryKey: ['cart'] });

      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else {
        router.push('/recommerce/dashboard');
      }
    } catch {
      setError(lang === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const t = {
    title:       lang === 'bn' ? 'রিকমার্স লগইন' : 'Recommerce Login',
    subtitle:    lang === 'bn' ? 'আপনার UNKORA রিকমার্স অ্যাকাউন্টে লগইন করুন' : 'Sign in to your UNKORA Recommerce account',
    email:       lang === 'bn' ? 'ইমেইল' : 'Email',
    password:    lang === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    signIn:      lang === 'bn' ? 'রিকমার্স লগইন' : 'Recommerce Sign In',
    noAccount:   lang === 'bn' ? 'নতুন রিকমার্স সেলার?' : 'New Recommerce Seller?',
    register:    lang === 'bn' ? 'নিবন্ধন করুন' : 'Register now',
    forgot:      lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?',
    customerText: lang === 'bn' ? 'কাস্টমার লগইন?' : 'Customer login?',
    panelTitle:  lang === 'bn' ? 'রিকমার্স\nসেলার প্যানেল' : 'Recommerce\nSeller Panel',
    panelSubtitle: lang === 'bn'
      ? 'পুরনো ও রিফার্বিশড পণ্য বিক্রি করুন — সহজে, দ্রুত এবং নিরাপদে।'
      : 'Sell used and refurbished items — easily, quickly, and safely.',
  };

  const benefits = lang === 'bn'
    ? [
        '♻️ পুরনো/রিফার্বিশড পণ্য বিক্রি করুন',
        '🏷️ গ্রেডিং সিস্টেম A+/A/B/C',
        '⚡ দ্রুত পেআউট — ৭২ ঘণ্টায়',
        '✓ বিশ্বস্ত মার্কেটপ্লেস',
        '✓ সহজ তালিকাভুক্তি প্রক্রিয়া',
      ]
    : [
        '♻️ Sell used / refurbished products',
        '🏷️ Grading system A+ / A / B / C',
        '⚡ Quick payout — within 72 hours',
        '✓ Trusted marketplace',
        '✓ Simple listing process',
      ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — emerald/teal theme */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10" style={{ background: 'linear-gradient(160deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black tracking-tight">UNKORA</span>
          <span className="text-emerald-300 text-xs font-bold border border-emerald-500 rounded-full px-2 py-0.5">Recommerce</span>
        </Link>

        <div>
          <div className="w-14 h-14 bg-emerald-400/20 rounded-2xl flex items-center justify-center mb-6">
            <Recycle className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-white text-3xl font-black leading-tight mb-4" style={{ whiteSpace: 'pre-line' }}>
            {t.panelTitle}
          </h2>
          <p className="text-emerald-200 text-sm leading-relaxed">
            {t.panelSubtitle}
          </p>

          {/* Grading preview */}
          <div className="mt-8 grid grid-cols-4 gap-2">
            {(['A+', 'A', 'B', 'C'] as const).map((grade, i) => {
              const colors = ['bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400'];
              return (
                <div key={grade} className={`${colors[i]} rounded-xl p-3 text-center`}>
                  <p className="text-white text-lg font-black">{grade}</p>
                  <p className="text-white/80 text-[10px] font-semibold mt-0.5">
                    {grade === 'A+' ? 'Mint' : grade === 'A' ? 'Good' : grade === 'B' ? 'Fair' : 'Worn'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-3">
            {benefits.map(f => (
              <p key={f} className="text-emerald-100 text-sm">{f}</p>
            ))}
          </div>
        </div>

        <p className="text-emerald-800 text-xs">© 2025 UNKORA Recommerce. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Recycle className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 text-lg font-black">UNKORA</span>
          <span className="text-emerald-600 text-xs font-bold border border-emerald-300 rounded-full px-2 py-0.5">Recommerce</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Language toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-xs text-gray-400 hover:text-emerald-600 border border-gray-200 rounded-full px-3 py-1 transition-colors"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Recycle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="seller@example.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">{t.password}</label>
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">{t.forgot}</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-sm"
              style={{ background: loading ? '#10b981' : 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Recycle className="w-4 h-4" />}
              {loading ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Signing in...') : t.signIn}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">{t.noAccount} </span>
            <Link href="/recommerce/register" className="text-sm font-bold text-emerald-600 hover:underline">{t.register}</Link>
          </div>

          {/* Customer login link */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
            >
              {t.customerText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommerceLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <RecommerceLoginContent />
    </Suspense>
  );
}
