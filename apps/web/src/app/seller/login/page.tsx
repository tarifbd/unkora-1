'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Store, ArrowRight, BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { saveUserRole } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function SellerLoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  // Already logged in → go to seller dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/seller/dashboard');
    }
  }, [isAuthenticated, router]);
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

      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/seller/dashboard');
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const t = {
    title:      lang === 'bn' ? 'সেলার লগইন' : 'Seller Login',
    subtitle:   lang === 'bn' ? 'আপনার UNKORA সেলার অ্যাকাউন্টে লগইন করুন' : 'Sign in to your UNKORA seller account',
    email:      lang === 'bn' ? 'ইমেইল' : 'Email',
    password:   lang === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    signIn:     lang === 'bn' ? 'সেলার লগইন' : 'Seller Sign In',
    noAccount:  lang === 'bn' ? 'নতুন সেলার?' : 'New seller?',
    apply:      lang === 'bn' ? 'সেলার হিসেবে আবেদন করুন' : 'Apply as a seller',
    customerText: lang === 'bn' ? 'কাস্টমার লগইন' : 'Customer login',
  };

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
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-white text-3xl font-black leading-tight mb-4">
            {lang === 'bn' ? 'সেলার প্যানেলে\nস্বাগতম' : 'Welcome to\nSeller Panel'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {lang === 'bn'
              ? 'আপনার দোকান পরিচালনা করুন, অর্ডার ট্র্যাক করুন এবং বিক্রয় বিশ্লেষণ দেখুন — সব এক জায়গায়।'
              : 'Manage your shop, track orders, and view sales analytics — all in one place.'}
          </p>

          <div className="mt-10 space-y-3">
            {[
              lang === 'bn' ? '✓ সহজ পণ্য ব্যবস্থাপনা' : '✓ Easy product management',
              lang === 'bn' ? '✓ রিয়েল-টাইম অর্ডার নোটিফিকেশন' : '✓ Real-time order notifications',
              lang === 'bn' ? '✓ বিক্রয় বিশ্লেষণ ড্যাশবোর্ড' : '✓ Sales analytics dashboard',
              lang === 'bn' ? '✓ দ্রুত পেমেন্ট উত্তোলন' : '✓ Fast payment withdrawal',
            ].map(f => (
              <p key={f} className="text-gray-300 text-sm">{f}</p>
            ))}
          </div>
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

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="seller@example.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
              {loading ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Signing in...') : t.signIn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">{t.noAccount} </span>
            <Link href="/seller/register" className="text-sm font-bold text-primary hover:underline">{t.apply}</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {t.customerText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
