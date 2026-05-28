'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';

const schema = z.object({
  firstName: z.string().min(2, 'Min 2 chars'),
  lastName:  z.string().min(2, 'Min 2 chars'),
  email:     z.string().email('Valid email required'),
  phone:     z.string().optional(),
  password:  z.string().min(8, 'Min 8 chars').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Need uppercase, lowercase, number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = ({ confirmPassword: _, ...data }: FormData) => registerUser.mutate(data);

  const t = {
    title:    lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    subtitle: lang === 'bn' ? 'UNKORA-তে যোগ দিন এবং পড়াশোনা শুরু করুন' : 'Join UNKORA and start reading today',
    firstName: lang === 'bn' ? 'প্রথম নাম' : 'First Name',
    lastName:  lang === 'bn' ? 'শেষ নাম' : 'Last Name',
    email:     lang === 'bn' ? 'ইমেইল' : 'Email',
    phone:     lang === 'bn' ? 'মোবাইল (ঐচ্ছিক)' : 'Phone (optional)',
    password:  lang === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    confirm:   lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password',
    submit:    lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    hasAccount:  lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?',
    signIn:    lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In',
    sellerText: lang === 'bn' ? 'সেলার হিসেবে রেজিস্টার করুন' : 'Register as a seller',
  };

  const inp = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors';

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
            {lang === 'bn' ? 'আজই শুরু করুন\nপড়ার যাত্রা' : 'Start Your\nReading Journey'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {lang === 'bn'
              ? 'বিনামূল্যে রেজিস্ট্রেশন করুন এবং লক্ষাধিক বইয়ের জগতে প্রবেশ করুন। অর্ডার ট্র্যাক করুন, উইশলিস্ট তৈরি করুন এবং আরও অনেক সুবিধা পান।'
              : 'Register for free and unlock a world of millions of books. Track orders, create wishlists, and enjoy exclusive deals.'}
          </p>

          <div className="mt-10 space-y-3">
            {[
              lang === 'bn' ? '✓ দ্রুত ও নিরাপদ ডেলিভারি' : '✓ Fast & secure delivery',
              lang === 'bn' ? '✓ এক্সক্লুসিভ অফার ও ছাড়' : '✓ Exclusive offers & discounts',
              lang === 'bn' ? '✓ সহজ রিটার্ন পলিসি' : '✓ Easy return policy',
              lang === 'bn' ? '✓ ২৪/৭ কাস্টমার সাপোর্ট' : '✓ 24/7 customer support',
            ].map(f => (
              <p key={f} className="text-gray-300 text-sm">{f}</p>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2025 UNKORA. All rights reserved.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.firstName}</label>
                <input {...register('firstName')} className={inp} placeholder="Rafiq" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.lastName}</label>
                <input {...register('lastName')} className={inp} placeholder="Islam" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input {...register('email')} type="email" className={inp} placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.phone}</label>
              <input {...register('phone')} type="tel" className={inp} placeholder="01700000000" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className={`${inp} pr-11`}
                  placeholder="Min 8 chars"
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
              <input {...register('confirmPassword')} type="password" className={inp} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {registerUser.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Registration failed. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={registerUser.isPending}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {registerUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {registerUser.isPending ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...') : t.submit}
            </button>
          </form>

          <div className="mt-6">
            <SocialLoginButtons redirectTo="/" />
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">{t.hasAccount} </span>
            <Link href="/login" className="text-sm font-bold text-primary hover:underline">{t.signIn}</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link
              href="/seller/apply"
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
