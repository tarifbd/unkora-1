'use client';

import Link from 'next/link';
import {
  BookOpen, TrendingUp, Zap, ArrowRight, Star,
  LayoutDashboard, Clock, ShieldCheck, CheckCircle,
  DollarSign, Users, Globe, BookMarked, Lock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { useAuthStore } from '@/store/auth.store';

// ─── Smart CTA based on seller status ────────────────────────

function SmartCTA() {
  const { isAuthenticated } = useAuthStore();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', 'me-status'],
    queryFn: sellerApi.myStatus,
    enabled: isAuthenticated,
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/login?redirect=/seller/apply"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
          বিক্রি শুরু করুন <ArrowRight className="w-5 h-5" />
        </Link>
        <a href="#how-it-works"
          className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
          কিভাবে কাজ করে?
        </a>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center"><div className="w-44 h-14 bg-white/10 animate-pulse rounded-2xl" /></div>;
  }

  if (seller?.status === 'ACTIVE') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-5 py-2.5 text-green-300 text-sm font-semibold">
          <ShieldCheck className="w-4 h-4" /> আপনার সেলার অ্যাকাউন্ট সক্রিয়
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/seller/dashboard"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold py-4 px-8 rounded-2xl text-lg hover:bg-primary/90 transition-all hover:-translate-y-0.5">
            <LayoutDashboard className="w-5 h-5" /> ড্যাশবোর্ড
          </Link>
          <Link href="/publish/submit"
            className="inline-flex items-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
            <BookOpen className="w-5 h-5" /> + বই জমা দিন
          </Link>
        </div>
      </div>
    );
  }

  if (seller?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-3 text-yellow-300 font-semibold">
          <Clock className="w-4 h-4" /> আপনার আবেদন পর্যালোচনাধীন — সাধারণত ৩-৫ কার্যদিবস
        </div>
        <Link href="/seller/dashboard"
          className="inline-flex items-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 font-bold py-3 px-6 rounded-2xl transition-all">
          ড্যাশবোর্ড দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/seller/apply"
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
        বিনামূল্যে নিবন্ধন করুন <ArrowRight className="w-5 h-5" />
      </Link>
      <a href="#how-it-works"
        className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
        কিভাবে কাজ করে?
      </a>
    </div>
  );
}

// ─── Final CTA (auth-aware, same as SmartCTA) ────────────────

function FinalCTA() {
  const { isAuthenticated } = useAuthStore();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', 'me-status'],
    queryFn: sellerApi.myStatus,
    enabled: isAuthenticated,
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/login?redirect=/seller/apply"
          className="inline-flex items-center gap-3 bg-primary text-white font-black py-4 px-10 rounded-2xl text-lg hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
          <BookOpen className="w-6 h-6" /> সেলার হিসেবে নিবন্ধন করুন
        </Link>
        <Link href="/login?redirect=/publish/submit"
          className="inline-flex items-center gap-3 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
          <Zap className="w-5 h-5" /> সরাসরি বই জমা দিন
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center"><div className="w-64 h-14 bg-white/10 animate-pulse rounded-2xl" /></div>;
  }

  if (seller?.status === 'ACTIVE') {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/seller/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-white font-black py-4 px-8 rounded-2xl text-lg hover:bg-primary/90 transition-all hover:-translate-y-0.5">
          <LayoutDashboard className="w-5 h-5" /> ড্যাশবোর্ড
        </Link>
        <Link href="/publish/submit"
          className="inline-flex items-center gap-3 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
          <BookOpen className="w-5 h-5" /> + বই জমা দিন
        </Link>
      </div>
    );
  }

  if (seller?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-3 text-yellow-300 font-semibold">
          <Clock className="w-4 h-4" /> আপনার আবেদন পর্যালোচনাধীন
        </div>
        <Link href="/seller/dashboard"
          className="inline-flex items-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 font-bold py-3 px-6 rounded-2xl transition-all">
          ড্যাশবোর্ড দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/seller/apply"
        className="inline-flex items-center gap-3 bg-primary text-white font-black py-4 px-10 rounded-2xl text-lg hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
        <BookOpen className="w-6 h-6" /> সেলার হিসেবে নিবন্ধন করুন
      </Link>
      <Link href="/publish/submit"
        className="inline-flex items-center gap-3 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all">
        <Zap className="w-5 h-5" /> সরাসরি বই জমা দিন
      </Link>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function SellOnUnkoraPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2e] to-[#0a0a1a] text-white py-24 px-4">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 rounded-full px-5 py-2 text-sm font-semibold text-primary">
              <Star className="w-4 h-4 fill-primary" /> বাংলাদেশের #১ বই মার্কেটপ্লেস
            </div>
          </div>

          <h1 className="text-center text-4xl md:text-6xl font-black leading-tight mb-6">
            আপনার বই বিক্রি করুন
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-green-400 to-emerald-400">
              UNKORA
            </span>
            -তে
          </h1>

          <p className="text-center text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-4">
            E-Book বা প্রিন্ট বই — সরাসরি লক্ষ পাঠকের কাছে বিক্রি করুন।
          </p>
          <p className="text-center text-gray-500 text-sm mb-12">
            Sell your e-books & physical books directly to thousands of readers across Bangladesh.
          </p>

          {/* Smart CTA */}
          <div className="flex justify-center mb-16">
            <SmartCTA />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto border-t border-gray-800 pt-10">
            {[
              { value: '১০,০০০+', sub: 'বই', en: 'Books' },
              { value: '৫০,০০০+', sub: 'পাঠক', en: 'Readers' },
              { value: '৭০%', sub: 'রয়্যালটি (E-Book)', en: 'Royalty' },
            ].map(s => (
              <div key={s.sub} className="text-center">
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-xs font-semibold text-gray-400 mt-1">{s.sub}</p>
                <p className="text-[10px] text-gray-600">{s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOK TYPES ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">কোন ধরনের বই বিক্রি করতে পারবেন?</h2>
            <p className="text-gray-500">What types of books can you sell?</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* E-Book */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">E-Book</h3>
                  <p className="text-purple-600 font-bold text-sm">ডিজিটাল বই</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  { icon: '💰', text: 'প্রতি বিক্রয়ে ৭০% রয়্যালটি', sub: '70% royalty per sale' },
                  { icon: '⚡', text: 'তাৎক্ষণিক ডেলিভারি (PDF/EPUB)', sub: 'Instant digital delivery' },
                  { icon: '🌏', text: 'সারাবিশ্বে বিক্রি করুন', sub: 'Sell worldwide' },
                  { icon: '📊', text: 'রিয়েল-টাইম বিক্রয় ট্র্যাকিং', sub: 'Live sales tracking' },
                  { icon: '🔒', text: 'নিরাপদ ডিজিটাল ডেলিভারি', sub: 'Secure delivery system' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bg-purple-600/10 rounded-xl p-3 text-center mb-4">
                <p className="text-sm font-bold text-purple-800">উদাহরণ: ৳300 দামের E-Book বিক্রি হলে আপনি পাবেন</p>
                <p className="text-3xl font-black text-purple-600">৳210</p>
                <p className="text-xs text-purple-500">per sale (70% royalty)</p>
              </div>
              <Link href="/publish/submit?type=ebook"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors text-sm">
                <Zap className="w-4 h-4" /> E-Book হিসেবে জমা দিন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Physical Book */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                  <BookMarked className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Physical Book</h3>
                  <p className="text-green-600 font-bold text-sm">মুদ্রণ বই</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  { icon: '💰', text: 'প্রতি বিক্রয়ে ১০% রয়্যালটি', sub: '10% royalty per sale' },
                  { icon: '📦', text: 'UNKORA পণ্য স্টক ও শিপমেন্ট করে', sub: 'We handle stock & shipping' },
                  { icon: '🔍', text: 'প্রতিটি বই মানসম্মত', sub: 'Quality reviewed by our team' },
                  { icon: '🇧🇩', text: 'সারা বাংলাদেশে ডেলিভারি', sub: 'Nationwide delivery' },
                  { icon: '📈', text: 'UNKORA-র মার্কেটিং নেটওয়ার্ক', sub: 'Access to our marketing' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bg-green-600/10 rounded-xl p-3 text-center mb-4">
                <p className="text-sm font-bold text-green-800">উদাহরণ: ৳400 দামের বই বিক্রি হলে আপনি পাবেন</p>
                <p className="text-3xl font-black text-green-600">৳40</p>
                <p className="text-xs text-green-500">per sale (10% royalty)</p>
              </div>
              <Link href="/publish/submit?type=physical"
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm">
                <BookMarked className="w-4 h-4" /> Physical Book হিসেবে জমা দিন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">কিভাবে কাজ করে?</h2>
            <p className="text-gray-500">How It Works — Simple 4 Steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '১', icon: '👤', color: 'from-blue-500 to-blue-600',
                title: 'সেলার হিসেবে নিবন্ধন',
                en: 'Register as Seller',
                desc: 'বিনামূল্যে সেলার অ্যাকাউন্ট খুলুন। দোকানের নাম ও তথ্য দিন।',
                link: '/seller/apply',
              },
              {
                step: '২', icon: '📤', color: 'from-purple-500 to-purple-600',
                title: 'বই জমা দিন',
                en: 'Submit Your Book',
                desc: 'E-book হলে PDF লিংক দিন। Physical হলে বইয়ের তথ্য পূরণ করুন।',
                link: '/publish/submit',
              },
              {
                step: '৩', icon: '✅', color: 'from-orange-500 to-orange-600',
                title: 'রিভিউ ও প্রকাশনা',
                en: 'Review & Publish',
                desc: 'আমাদের টিম ৩-৫ কার্যদিবসে রিভিউ করে অনুমোদন দেবে।',
                link: null,
              },
              {
                step: '৪', icon: '💸', color: 'from-green-500 to-green-600',
                title: 'আয় করুন',
                en: 'Earn Revenue',
                desc: 'প্রতিটি বিক্রয়ে রয়্যালটি জমা হবে। বিকাশ/ব্যাংকে উত্তোলন করুন।',
                link: '/seller/earnings',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-center relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center mx-auto mb-3 -mt-2">
                    {item.step}
                  </div>
                  <h3 className="font-black text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mb-3">{item.en}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  {item.link && (
                    <Link href={item.link} className="mt-3 inline-flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                      শুরু করুন <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROYALTY COMPARISON ── */}
      <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black mb-2">রয়্যালটি তুলনা</h2>
            <p className="text-gray-400 text-sm">Royalty Comparison</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
                <h3 className="font-black text-lg">E-Book বিক্রি</h3>
              </div>
              <div className="space-y-3">
                {[
                  { price: 100, royalty: 70 }, { price: 200, royalty: 140 },
                  { price: 300, royalty: 210 }, { price: 500, royalty: 350 },
                ].map(r => (
                  <div key={r.price} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2.5">
                    <span className="text-gray-300 text-sm">বিক্রয় মূল্য ৳{r.price}</span>
                    <span className="font-black text-purple-400 text-lg">৳{r.royalty} <span className="text-xs text-purple-300">(70%)</span></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-4">
                <BookMarked className="w-6 h-6 text-green-400" />
                <h3 className="font-black text-lg">Physical Book বিক্রি</h3>
              </div>
              <div className="space-y-3">
                {[
                  { price: 200, royalty: 20 }, { price: 300, royalty: 30 },
                  { price: 400, royalty: 40 }, { price: 600, royalty: 60 },
                ].map(r => (
                  <div key={r.price} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2.5">
                    <span className="text-gray-300 text-sm">বিক্রয় মূল্য ৳{r.price}</span>
                    <span className="font-black text-green-400 text-lg">৳{r.royalty} <span className="text-xs text-green-300">(10%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">কেন UNKORA বেছে নেবেন?</h2>
            <p className="text-gray-500">Why Sell on UNKORA?</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-50 text-green-600', title: 'সর্বোচ্চ রয়্যালটি', en: 'Highest Royalty', desc: 'E-book-এ ৭০% পর্যন্ত রয়্যালটি — বাংলাদেশে সর্বোচ্চ।' },
              { icon: <Zap className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', title: 'তাৎক্ষণিক E-Book ডেলিভারি', en: 'Instant Delivery', desc: 'ক্রেতা পেমেন্ট করার সঙ্গে সঙ্গে PDF/EPUB স্বয়ংক্রিয়ভাবে পাঠানো হয়।' },
              { icon: <TrendingUp className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', title: 'লাইভ ড্যাশবোর্ড', en: 'Live Dashboard', desc: 'রিয়েল-টাইমে বিক্রয়, ডাউনলোড ও আয় দেখুন।' },
              { icon: <Users className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600', title: 'লক্ষ পাঠক', en: '50k+ Readers', desc: 'UNKORA-এর ৫০,০০০+ সক্রিয় পাঠকের কাছে আপনার বই পৌঁছান।' },
              { icon: <Globe className="w-6 h-6" />, color: 'bg-cyan-50 text-cyan-600', title: 'সারা দেশে ডেলিভারি', en: 'Nationwide', desc: 'Physical বই সারা বাংলাদেশে হোম ডেলিভারি — আপনার কোনো চিন্তা নেই।' },
              { icon: <Lock className="w-6 h-6" />, color: 'bg-red-50 text-red-600', title: 'নিরাপদ পেমেন্ট', en: 'Secure Payout', desc: 'বিকাশ, নগদ, রকেট বা ব্যাংকে নিরাপদে আয় উত্তোলন করুন।' },
            ].map(f => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>{f.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-0.5">{f.title}</h3>
                  <p className="text-[10px] text-gray-400 font-medium mb-1.5">{f.en}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">সাধারণ প্রশ্ন</h2>
          <div className="space-y-3">
            {[
              { q: 'E-Book কি ফরম্যাটে আপলোড করতে হবে?', a: 'PDF বা EPUB ফরম্যাট সমর্থিত। আপলোডের পর আমরা ক্রেতাদের সরাসরি ডাউনলোড লিংক পাঠাব।' },
              { q: 'Physical book-এর স্টক কে রাখবে?', a: 'UNKORA টিম আপনার কাছ থেকে বই সংগ্রহ করবে এবং স্টক রাখবে। শিপমেন্ট ও ডেলিভারি আমরাই করব।' },
              { q: 'আয় কত দিনে পাব?', a: 'প্রতি মাসে ১৫ তারিখের মধ্যে গত মাসের আয় আপনার নির্বাচিত মাধ্যমে পাঠানো হবে।' },
              { q: 'একজন লেখক কতটি বই জমা দিতে পারবেন?', a: 'কোনো সীমা নেই। আপনি যত ইচ্ছা বই জমা দিতে পারবেন।' },
              { q: 'কি ধরনের বই গ্রহণযোগ্য?', a: 'সব ধরনের বই — উপন্যাস, ইসলামিক, একাডেমিক, সেলফ-হেলপ, কবিতা, শিশু-সাহিত্য ইত্যাদি। তবে অনৈতিক বা বেআইনি বিষয়বস্তু গ্রহণ করা হবে না।' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">{faq.q}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-[#0d1b2e] to-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            আজই শুরু করুন — বিনামূল্যে
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            No setup fee. No monthly charge. Only pay when you sell.
          </p>
          <FinalCTA />
        </div>
      </section>

    </main>
  );
}
