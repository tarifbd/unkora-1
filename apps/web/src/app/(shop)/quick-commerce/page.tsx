'use client';

import Link from 'next/link';
import { Zap, Clock, ShieldCheck, Truck, ChevronRight, Star, Tag, Package, Flame } from 'lucide-react';

const CATEGORIES = [
  { emoji: '🥦', label: 'Fresh Vegetables', labelBn: 'তাজা সবজি', href: '/products?categorySlug=daily-needs&sub=vegetables', color: 'bg-green-50 border-green-200', badge: '10 min' },
  { emoji: '🍎', label: 'Fruits', labelBn: 'ফল', href: '/products?categorySlug=daily-needs&sub=fruits', color: 'bg-red-50 border-red-200', badge: '10 min' },
  { emoji: '🥛', label: 'Dairy & Eggs', labelBn: 'দুধ ও ডিম', href: '/products?categorySlug=daily-needs&sub=dairy', color: 'bg-yellow-50 border-yellow-200', badge: '15 min' },
  { emoji: '🍞', label: 'Bakery', labelBn: 'বেকারি', href: '/products?categorySlug=daily-needs&sub=bakery', color: 'bg-amber-50 border-amber-200', badge: '15 min' },
  { emoji: '💊', label: 'Medicine', labelBn: 'ওষুধ', href: '/products?categorySlug=daily-needs&sub=medicine', color: 'bg-blue-50 border-blue-200', badge: '20 min' },
  { emoji: '🧴', label: 'Personal Care', labelBn: 'ব্যক্তিগত যত্ন', href: '/products?categorySlug=daily-needs&sub=personal-care', color: 'bg-purple-50 border-purple-200', badge: '20 min' },
  { emoji: '🧹', label: 'Cleaning', labelBn: 'পরিষ্কার', href: '/products?categorySlug=daily-needs&sub=cleaning', color: 'bg-cyan-50 border-cyan-200', badge: '20 min' },
  { emoji: '🍳', label: 'Kitchen Essentials', labelBn: 'রান্নাঘর', href: '/products?categorySlug=daily-needs&sub=kitchen', color: 'bg-orange-50 border-orange-200', badge: '25 min' },
  { emoji: '🧃', label: 'Beverages', labelBn: 'পানীয়', href: '/products?categorySlug=daily-needs&sub=beverages', color: 'bg-teal-50 border-teal-200', badge: '20 min' },
  { emoji: '🍫', label: 'Snacks & Sweets', labelBn: 'স্ন্যাকস ও মিষ্টি', href: '/products?categorySlug=daily-needs&sub=snacks', color: 'bg-pink-50 border-pink-200', badge: '20 min' },
  { emoji: '🍚', label: 'Rice, Flour & Dal', labelBn: 'চাল, আটা ও ডাল', href: '/products?categorySlug=daily-needs&sub=staples', color: 'bg-lime-50 border-lime-200', badge: '30 min' },
  { emoji: '🐾', label: 'Pet Supplies', labelBn: 'পোষা প্রাণী', href: '/products?categorySlug=daily-needs&sub=pet', color: 'bg-rose-50 border-rose-200', badge: '25 min' },
];

const OFFERS = [
  { label: '20% OFF first order', labelBn: 'প্রথম অর্ডারে ২০% ছাড়', code: 'QUICK20', color: 'from-emerald-500 to-teal-600' },
  { label: 'Free delivery on ৳299+', labelBn: '৳২৯৯+ অর্ডারে ফ্রি ডেলিভারি', code: null, color: 'from-blue-500 to-indigo-600' },
  { label: 'Subscribe & Save 10%', labelBn: 'সাবস্ক্রাইব করে ১০% সাশ্রয়', code: 'SAVE10', color: 'from-purple-500 to-pink-600' },
];

const FEATURES = [
  { icon: Zap, label: 'Express Delivery', labelBn: 'এক্সপ্রেস ডেলিভারি', sub: '10–30 minutes', subBn: '১০–৩০ মিনিটে', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Clock, label: 'Order Anytime', labelBn: 'যেকোনো সময় অর্ডার', sub: '6 AM – 12 AM', subBn: 'সকাল ৬টা – রাত ১২টা', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: ShieldCheck, label: 'Quality Assured', labelBn: 'গুণমান নিশ্চিত', sub: 'Fresh & verified', subBn: 'তাজা ও যাচাইকৃত', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Truck, label: 'Free Delivery', labelBn: 'ফ্রি ডেলিভারি', sub: 'Orders above ৳299', subBn: '৳২৯৯+ অর্ডারে', color: 'text-purple-500', bg: 'bg-purple-50' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse & Add', titleBn: 'ব্রাউজ ও অ্যাড করুন', desc: 'Choose from thousands of daily essentials', descBn: 'হাজারো পণ্য থেকে বেছে নিন' },
  { step: '02', title: 'Quick Checkout', titleBn: 'দ্রুত চেকআউট', desc: 'Pay online or cash on delivery', descBn: 'অনলাইন বা ক্যাশ অন ডেলিভারি' },
  { step: '03', title: 'Track Order', titleBn: 'অর্ডার ট্র্যাক করুন', desc: 'Live tracking from store to door', descBn: 'রিয়েল-টাইম ট্র্যাকিং' },
  { step: '04', title: 'Delivered Fast', titleBn: 'দ্রুত ডেলিভারি', desc: 'Hot & fresh at your doorstep', descBn: 'দরজায় পৌঁছে যাবে' },
];

export default function QuickCommercePage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f4c3a 0%, #1a7a5e 50%, #22c55e 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {['⚡','🚀','⚡','🛵','⚡'].map((e, i) => (
            <span key={i} className="absolute text-6xl" style={{ top: `${15 + i * 18}%`, left: `${5 + i * 22}%`, opacity: 0.4 }}>{e}</span>
          ))}
        </div>
        <div className="container py-12 sm:py-16 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-200 text-xs font-bold px-3 py-1 rounded-full border border-green-400/30">
              <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
              NOW LIVE IN DHAKA
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">
            Quick Commerce ⚡<br />
            <span className="text-green-300">১০–৩০ মিনিটে ডেলিভারি</span>
          </h1>
          <p className="text-green-100 text-base sm:text-lg mb-8 max-w-xl">
            Groceries, medicines, fresh produce & daily essentials — delivered express to your door. No minimum order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products?categorySlug=daily-needs" className="inline-flex items-center gap-2 bg-white text-green-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Zap className="h-4 w-4" /> Shop Now
            </Link>
            <Link href="/track-order" className="inline-flex items-center gap-2 bg-green-400/20 border border-green-400/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-400/30 transition-colors">
              <Truck className="h-4 w-4" /> Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container -mt-6 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <p className="font-bold text-sm text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-500">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container py-8 space-y-10">

        {/* Offers */}
        <div className="grid sm:grid-cols-3 gap-4">
          {OFFERS.map(o => (
            <div key={o.label} className={`rounded-2xl p-5 bg-gradient-to-br ${o.color} text-white shadow-lg`}>
              <Tag className="h-5 w-5 mb-2 opacity-80" />
              <p className="font-bold text-base">{o.label}</p>
              {o.code && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1 text-sm font-mono font-bold">
                  {o.code}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" /> Express Categories
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">All delivered in under 30 minutes</p>
            </div>
            <Link href="/products?categorySlug=daily-needs" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(cat => (
              <Link key={cat.label} href={cat.href}
                className={`group relative rounded-2xl border-2 ${cat.color} p-4 flex flex-col items-center gap-2 text-center hover:shadow-lg transition-all hover:-translate-y-0.5`}>
                <span className="text-3xl">{cat.emoji}</span>
                <p className="text-xs font-bold text-gray-800 leading-tight">{cat.label}</p>
                <span className="absolute top-2 right-2 text-[9px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                  {cat.badge}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6 text-center">How Quick Commerce Works</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                  style={{ background: `linear-gradient(135deg, #0f4c3a, #22c55e)` }}>
                  {step.step}
                </div>
                {i < 3 && <div className="hidden sm:block absolute translate-x-[4.5rem] w-8 h-0.5 bg-gray-200 mt-7" />}
                <div>
                  <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Brands */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Popular for Quick Delivery
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🥛', name: 'Dairy Products', href: '/products?categorySlug=daily-needs&sub=dairy', items: '50+ products' },
              { emoji: '🌾', name: 'Grains & Staples', href: '/products?categorySlug=daily-needs&sub=staples', items: '80+ products' },
              { emoji: '💊', name: 'OTC Medicine', href: '/products?categorySlug=daily-needs&sub=medicine', items: '200+ products' },
              { emoji: '🧴', name: 'Hygiene & Care', href: '/products?categorySlug=daily-needs&sub=personal-care', items: '150+ products' },
            ].map(b => (
              <Link key={b.name} href={b.href}
                className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
                <span className="text-2xl">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.items}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f4c3a, #1a7a5e)' }}>
          <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-black text-white mb-2">Download the Unkora App</h3>
              <p className="text-green-200 text-sm">Get exclusive app-only deals & faster checkout. Track your order live on the map.</p>
            </div>
            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white">
                <Package className="h-5 w-5" />
                <div>
                  <p className="text-[10px] opacity-60">Download on</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white">
                <Zap className="h-5 w-5" />
                <div>
                  <p className="text-[10px] opacity-60">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
