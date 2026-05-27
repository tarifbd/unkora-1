'use client';

import Link from 'next/link';
import { BookOpen, TrendingUp, Users, CheckCircle, ArrowRight, Star, LayoutDashboard, Clock, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { useAuthStore } from '@/store/auth.store';

function SellerCTA() {
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
        <Link
          href="/login?redirect=/seller/apply"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          শুরু করুন <ArrowRight className="w-5 h-5" />
        </Link>
        <a href="#how-it-works"
          className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
        >
          আরো জানুন
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-40 h-12 bg-white/10 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Already ACTIVE seller
  if (seller?.status === 'ACTIVE') {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 text-sm text-green-300">
          <ShieldCheck className="w-4 h-4" /> সক্রিয় সেলার অ্যাকাউন্ট
        </div>
        <Link href="/seller/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <LayoutDashboard className="w-5 h-5" /> সেলার ড্যাশবোর্ড <ArrowRight className="w-5 h-5" />
        </Link>
        <Link href="/publish/submit"
          className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
        >
          <BookOpen className="w-5 h-5" /> বই জমা দিন
        </Link>
      </div>
    );
  }

  // Pending seller
  if (seller?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2.5 text-yellow-300">
          <Clock className="w-4 h-4" />
          <span className="font-semibold text-sm">আপনার আবেদন পর্যালোচনাধীন — ৩-৫ কার্যদিবস</span>
        </div>
        <Link href="/seller/dashboard"
          className="inline-flex items-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          ড্যাশবোর্ড দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Not yet a seller → show apply
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        href="/seller/apply"
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
      >
        সেলার হিসেবে আবেদন করুন <ArrowRight className="w-5 h-5" />
      </Link>
      <a href="#how-it-works"
        className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
      >
        আরো জানুন
      </a>
    </div>
  );
}

export default function PublishPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Star className="w-4 h-4 fill-primary" /> বাংলাদেশের #১ বই মার্কেটপ্লেস
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            আপনার বই বিক্রি করুন{' '}
            <span className="text-primary">UNKORA</span>-তে
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-3 max-w-2xl mx-auto">
            Sell Your Books on UNKORA
          </p>
          <p className="text-gray-400 text-base mb-10 max-w-2xl mx-auto">
            বাংলাদেশের সেরা বই মার্কেটপ্লেসে আপনার বই লিস্ট করুন এবং লক্ষ পাঠকের কাছে পৌঁছান। প্রতিটি বিক্রয়ে উপার্জন করুন।
          </p>
          <div className="mb-12">
            <SellerCTA />
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto border-t border-gray-700 pt-8">
            {[
              { value: '১০,০০০+', label: 'বই' },
              { value: '৫০,০০০+', label: 'পাঠক' },
              { value: '১০%', label: 'রয়্যালটি' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">কিভাবে কাজ করে?</h2>
            <p className="text-gray-500">How It Works</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '০১', icon: '📝', title: 'আবেদন করুন', en: 'Apply as Seller',
                desc: 'সেলার হিসেবে নিবন্ধন করুন। আপনার দোকানের তথ্য ও পরিচয় দিন।',
                link: '/seller/apply',
              },
              {
                step: '০২', icon: '✅', title: 'অনুমোদন', en: 'Get Approved',
                desc: 'আমাদের টিম ৩-৫ কার্যদিবসের মধ্যে আপনার আবেদন অনুমোদন দেবে।',
                link: null,
              },
              {
                step: '০৩', icon: '📚', title: 'বই জমা দিন', en: 'Submit Books',
                desc: 'অনুমোদনের পর আপনার বইয়ের তথ্য জমা দিন। আমরা প্রোডাক্ট তৈরি করব।',
                link: '/publish/submit',
              },
              {
                step: '০৪', icon: '💰', title: 'আয় করুন', en: 'Earn Revenue',
                desc: 'বই বিক্রি হলে আপনার ড্যাশবোর্ডে আয় জমা হবে। যেকোনো সময় উত্তোলন করুন।',
                link: '/seller/dashboard',
              },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-3 right-3 text-5xl font-black text-gray-100 select-none">{item.step}</div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-wide mb-3">{item.en}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                {item.link && (
                  <Link href={item.link} className="mt-4 inline-flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                    শুরু করুন <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">কেন UNKORA বেছে নেবেন?</h2>
            <p className="text-gray-500">Why Choose UNKORA</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <TrendingUp className="w-7 h-7" />, color: 'bg-green-50 text-green-600', title: '১০% রয়্যালটি', en: '10% Royalty', desc: 'প্রতিটি বিক্রয়ে ন্যায্য রয়্যালটি পান। স্বচ্ছ পেমেন্ট সিস্টেম।' },
              { icon: <TrendingUp className="w-7 h-7" />, color: 'bg-blue-50 text-blue-600', title: 'রিয়েল-টাইম ড্যাশবোর্ড', en: 'Live Dashboard', desc: 'বিক্রয়, অর্ডার, আয় সব রিয়েল-টাইমে ট্র্যাক করুন।' },
              { icon: <Users className="w-7 h-7" />, color: 'bg-orange-50 text-orange-600', title: 'লক্ষ পাঠক', en: 'Reach Readers', desc: 'UNKORA-এর বিশাল পাঠক সম্প্রদায়ের কাছে পৌঁছান।' },
              { icon: <BookOpen className="w-7 h-7" />, color: 'bg-purple-50 text-purple-600', title: 'সহজ প্রক্রিয়া', en: 'Easy Process', desc: 'সহজ অনলাইন ফর্মে তথ্য দিন। কোনো জটিলতা নেই।' },
              { icon: <CheckCircle className="w-7 h-7" />, color: 'bg-emerald-50 text-emerald-600', title: 'দ্রুত উত্তোলন', en: 'Fast Payout', desc: 'আপনার আয় সরাসরি ব্যাংক, বিকাশ বা নগদে উত্তোলন করুন।' },
              { icon: <Star className="w-7 h-7" />, color: 'bg-amber-50 text-amber-600', title: 'বিশ্বস্ত প্ল্যাটফর্ম', en: 'Trusted Platform', desc: 'বাংলাদেশের বিশ্বস্ত ই-কমার্স প্ল্যাটফর্মে বিক্রি করুন।' },
            ].map(b => (
              <div key={b.title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.color}`}>{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">{b.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mb-2">{b.en}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-green-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">আজই শুরু করুন</h2>
          <p className="text-green-100 text-lg mb-8">Start Today — বিনামূল্যে নিবন্ধন করুন</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/seller/apply"
              className="inline-flex items-center gap-3 bg-white text-primary font-black py-4 px-10 rounded-xl text-lg hover:bg-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <BookOpen className="w-6 h-6" /> সেলার হিসেবে আবেদন করুন <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-3 border-2 border-white/40 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-white/10 transition-all"
            >
              <LayoutDashboard className="w-5 h-5" /> ড্যাশবোর্ড
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
