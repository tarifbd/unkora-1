'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => login.mutate(data);

  const t = {
    title:       lang === 'bn' ? 'স্বাগতম!' : 'Welcome back!',
    subtitle:    lang === 'bn' ? 'আপনার UNKORA অ্যাকাউন্টে লগইন করুন' : 'Sign in to your UNKORA account',
    email:       lang === 'bn' ? 'ইমেইল' : 'Email',
    password:    lang === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    forgot:      lang === 'bn' ? 'ভুলে গেছেন?' : 'Forgot?',
    signIn:      lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In',
    noAccount:   lang === 'bn' ? 'নতুন ব্যবহারকারী?' : 'New here?',
    register:    lang === 'bn' ? 'রেজিস্টার করুন' : 'Register',
    sellerText:  lang === 'bn' ? 'সেলার লগইন করুন' : 'Seller login',
    invalidCred: lang === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' : 'Invalid email or password',
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-900 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black tracking-tight">UNKORA</span>
        </Link>

        <div>
          <h2 className="text-white text-3xl font-black leading-tight mb-4">
            {lang === 'bn' ? 'বাংলাদেশের সেরা\nবইয়ের মার্কেটপ্লেস' : 'Bangladesh\'s Best\nBook Marketplace'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {lang === 'bn'
              ? 'লক্ষাধিক বই, সেরা লেখকদের রচনা এবং দ্রুত ডেলিভারি সহ বাংলাদেশের সবচেয়ে বড় অনলাইন বই মার্কেটপ্লেসে আপনাকে স্বাগত।'
              : 'Welcome to Bangladesh\'s largest online book marketplace with millions of titles, fast delivery, and the best prices.'}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: '৫০,০০০+', l: lang === 'bn' ? 'বই' : 'Books' },
              { n: '১০,০০০+', l: lang === 'bn' ? 'বিক্রেতা' : 'Sellers' },
              { n: '৫ লক্ষ+', l: lang === 'bn' ? 'পাঠক' : 'Readers' },
            ].map(s => (
              <div key={s.l} className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-white font-black text-lg">{s.n}</div>
                <div className="text-gray-400 text-xs mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2025 UNKORA. All rights reserved.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 text-lg font-black">UNKORA</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Lang toggle */}
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">{t.password}</label>
                <span className="text-xs text-primary cursor-pointer hover:underline">{t.forgot}</span>
              </div>
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

            {login.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {t.invalidCred}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {login.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {login.isPending ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Signing in...') : t.signIn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">{t.noAccount} </span>
            <Link href="/register" className="text-sm font-bold text-primary hover:underline">{t.register}</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link
              href="/seller/login"
              className="text-sm text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {t.sellerText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
