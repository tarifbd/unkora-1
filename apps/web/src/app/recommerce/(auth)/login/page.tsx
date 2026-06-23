'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff, Loader2, ShoppingBag, Store, ArrowRight, CheckCircle, Tag, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
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

type Panel = 'buyer' | 'seller';

const t = {
  bn: {
    brand:        'সালভেজ ইয়ার্ড',
    tagline:      'পুরানো পণ্য, নতুন জীবন',
    buyerTab:     'ক্রেতা লগইন',
    sellerTab:    'বিক্রেতা লগইন',
    email:        'ইমেইল',
    password:     'পাসওয়ার্ড',
    forgot:       'পাসওয়ার্ড ভুলেছেন?',
    buyerSignIn:  'ক্রেতা হিসেবে প্রবেশ করুন',
    sellerSignIn: 'বিক্রেতা হিসেবে প্রবেশ করুন',
    loading:      'লোড হচ্ছে...',
    noAccount:    'অ্যাকাউন্ট নেই?',
    register:     'নিবন্ধন করুন',
    buyerRegister:'ক্রেতা হিসেবে নিবন্ধন',
    sellerRegister:'বিক্রেতা হিসেবে নিবন্ধন',
    backToMain:   'মূল সাইটে ফিরুন',
    buyerBenefits: ['✓ হাজারো পুরানো পণ্য ব্রাউজ করুন', '✓ সরাসরি বিক্রেতার সাথে যোগাযোগ', '✓ দাম তুলনা করুন', '✓ নিরাপদ লেনদেন'],
    sellerBenefits: ['✓ বিনামূল্যে পণ্য তালিকাভুক্ত করুন', '✓ লক্ষ ক্রেতার কাছে পৌঁছান', '✓ সহজে পণ্য পরিচালনা করুন', '✓ দ্রুত বিক্রয় নিশ্চিত করুন'],
    grades:       ['A+ অবস্থায়', 'A — ভালো', 'B — ঠিকঠাক', 'C — ব্যবহারযোগ্য'],
    buyerDesc:    'আপনার পছন্দের পুরানো পণ্য খুঁজুন এবং সরাসরি বিক্রেতার সাথে যোগাযোগ করুন।',
    sellerDesc:   'আপনার অব্যবহৃত পণ্য বিক্রি করুন এবং উপার্জন করুন — বিনামূল্যে।',
    error:        'ইমেইল বা পাসওয়ার্ড সঠিক নয়',
  },
  en: {
    brand:        'Salvage Yard',
    tagline:      'Pre-owned goods, new life',
    buyerTab:     'Buyer Login',
    sellerTab:    'Seller Login',
    email:        'Email',
    password:     'Password',
    forgot:       'Forgot password?',
    buyerSignIn:  'Sign in as Buyer',
    sellerSignIn: 'Sign in as Seller',
    loading:      'Signing in...',
    noAccount:    "Don't have an account?",
    register:     'Register',
    buyerRegister:'Register as Buyer',
    sellerRegister:'Register as Seller',
    backToMain:   'Back to main site',
    buyerBenefits: ['✓ Browse thousands of pre-owned items', '✓ Contact sellers directly', '✓ Compare prices', '✓ Safe transactions'],
    sellerBenefits: ['✓ List items for free', '✓ Reach millions of buyers', '✓ Easy listing management', '✓ Fast sales guaranteed'],
    grades:       ['A+ Condition', 'A — Good', 'B — Fair', 'C — Usable'],
    buyerDesc:    'Find the pre-owned items you love and connect directly with sellers.',
    sellerDesc:   'Sell your unused items and earn — completely free.',
    error:        'Invalid email or password',
  },
};

const GRADE_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-300' },
  { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-300' },
  { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-300' },
];

function LoginContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const redirectTo  = params.get('redirect');
  const defaultPanel = (params.get('as') === 'seller' ? 'seller' : 'buyer') as Panel;
  const qc          = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  const [panel,  setPanel]  = useState<Panel>(defaultPanel);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [lang,    setLang]    = useState<'bn' | 'en'>('bn');

  const tx = t[lang];

  useEffect(() => {
    if (isAuthenticated) {
      const dest = redirectTo && redirectTo.startsWith('/') ? redirectTo
        : panel === 'seller' ? '/recommerce/seller/dashboard'
        : '/recommerce';
      router.replace(dest);
    }
  }, [isAuthenticated, router, redirectTo, panel]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const switchPanel = (p: Panel) => { setPanel(p); setError(''); reset(); };

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
      } else if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else {
        router.push(panel === 'seller' ? '/recommerce/seller/dashboard' : '/recommerce');
      }
    } catch {
      setError(tx.error);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  const isBuyer = panel === 'buyer';

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Left branding panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10"
        style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white text-xl font-black tracking-tight">{tx.brand}</span>
            <p className="text-amber-400/70 text-[11px] font-medium">{tx.tagline}</p>
          </div>
        </Link>

        {/* Central content — switches with panel */}
        <div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${isBuyer ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
            {isBuyer
              ? <ShoppingBag className="w-7 h-7 text-blue-400" />
              : <Store className="w-7 h-7 text-amber-400" />
            }
          </div>

          <h2 className="text-white text-3xl font-black leading-tight mb-3">
            {isBuyer
              ? (lang === 'bn' ? 'পুরানো পণ্য খুঁজুন\nসেরা দামে' : 'Find pre-owned\ngoods at best price')
              : (lang === 'bn' ? 'আপনার পণ্য\nবিক্রি করুন' : 'Sell your items\nquickly & free')
            }
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {isBuyer ? tx.buyerDesc : tx.sellerDesc}
          </p>

          {/* Benefits */}
          <div className="space-y-2.5 mb-10">
            {(isBuyer ? tx.buyerBenefits : tx.sellerBenefits).map(b => (
              <p key={b} className="text-gray-300 text-sm flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {b.replace('✓ ', '')}
              </p>
            ))}
          </div>

          {/* Grade badges */}
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              {lang === 'bn' ? 'পণ্যের অবস্থা' : 'Item Condition'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {tx.grades.map((g, i) => (
                <span key={g} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${GRADE_COLORS[i]!.bg} ${GRADE_COLORS[i]!.text} ${GRADE_COLORS[i]!.border}`}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-gray-700 text-xs">© 2025 UNKORA · Salvage Yard. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 text-lg font-black">{tx.brand}</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Lang toggle */}
          <div className="flex justify-end mb-5">
            <button
              onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-xs text-gray-400 hover:text-amber-600 border border-gray-200 rounded-full px-3 py-1 transition-colors"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
          </div>

          {/* Buyer / Seller tab switcher */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-6 gap-1">
            <button
              onClick={() => switchPanel('buyer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                isBuyer
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {tx.buyerTab}
            </button>
            <button
              onClick={() => switchPanel('seller')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                !isBuyer
                  ? 'bg-white text-amber-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Store className="w-4 h-4" />
              {tx.sellerTab}
            </button>
          </div>

          {/* Panel indicator */}
          <div className={`flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl text-sm ${isBuyer ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
            {isBuyer
              ? <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              : <Store className="w-4 h-4 flex-shrink-0" />
            }
            <span className="font-semibold">{isBuyer ? tx.buyerDesc : tx.sellerDesc}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tx.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@email.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">{tx.password}</label>
                <Link href="/forgot-password" className="text-xs text-amber-600 hover:underline">{tx.forgot}</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
              className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-sm ${
                isBuyer
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isBuyer ? <ShoppingBag className="w-4 h-4" /> : <Store className="w-4 h-4" />
              }
              {loading ? tx.loading : isBuyer ? tx.buyerSignIn : tx.sellerSignIn}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">{tx.noAccount} </span>
            <Link
              href={isBuyer ? '/recommerce/register?as=buyer' : '/recommerce/register?as=seller'}
              className="text-sm font-bold text-amber-600 hover:underline"
            >
              {isBuyer ? tx.buyerRegister : tx.sellerRegister}
            </Link>
          </div>

          {/* Divider + cross-switch */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <Link href="/login" className="hover:text-amber-600 transition-colors flex items-center gap-1">
              {tx.backToMain} <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => switchPanel(isBuyer ? 'seller' : 'buyer')}
              className="hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              {isBuyer
                ? (lang === 'bn' ? 'বিক্রেতা? এখানে →' : 'Are you a seller? →')
                : (lang === 'bn' ? 'ক্রেতা? এখানে →' : 'Looking to buy? →')
              }
            </button>
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
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
