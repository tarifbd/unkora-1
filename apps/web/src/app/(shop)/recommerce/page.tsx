'use client';

import Link from 'next/link';
import { RefreshCw, ShieldCheck, Banknote, Star, ChevronRight, CheckCircle2, ArrowRight, Package, Smartphone, Shirt, BookOpen, Tv, Sofa, Car, Baby } from 'lucide-react';

const CATEGORIES = [
  { emoji: '📱', label: 'Refurbished Phones', labelBn: 'রিফার্বিশড মোবাইল', href: '/products?categorySlug=electronics&condition=refurbished&sub=phones', badge: 'Up to 60% off', badgeColor: 'bg-blue-500', icon: Smartphone },
  { emoji: '💻', label: 'Certified Laptops', labelBn: 'সার্টিফাইড ল্যাপটপ', href: '/products?categorySlug=electronics&condition=refurbished&sub=laptops', badge: 'Warranty incl.', badgeColor: 'bg-green-500', icon: Tv },
  { emoji: '👕', label: 'Pre-loved Fashion', labelBn: 'প্রি-লাভড ফ্যাশন', href: '/products?categorySlug=fashion-lifestyle&condition=used', badge: 'Eco-friendly', badgeColor: 'bg-emerald-500', icon: Shirt },
  { emoji: '📚', label: 'Used Books', labelBn: 'পুরানো বই', href: '/products?categorySlug=books&condition=used', badge: 'Save 70%', badgeColor: 'bg-amber-500', icon: BookOpen },
  { emoji: '🛋️', label: 'Furniture', labelBn: 'আসবাবপত্র', href: '/products?condition=used&sub=furniture', badge: 'Best value', badgeColor: 'bg-purple-500', icon: Sofa },
  { emoji: '👶', label: 'Baby & Kids', labelBn: 'শিশু পণ্য', href: '/products?categorySlug=baby-products&condition=used', badge: 'Like new', badgeColor: 'bg-pink-500', icon: Baby },
  { emoji: '🏏', label: 'Sports Equipment', labelBn: 'স্পোর্টস সরঞ্জাম', href: '/products?categorySlug=health-sports&condition=used', badge: 'Verified', badgeColor: 'bg-orange-500', icon: Package },
  { emoji: '🚗', label: 'Auto Accessories', labelBn: 'গাড়ির আনুষাঙ্গিক', href: '/products?condition=used&sub=auto', badge: 'Inspected', badgeColor: 'bg-slate-500', icon: Car },
];

const GRADES = [
  {
    grade: 'A+', name: 'Like New', nameBn: 'একেবারে নতুনের মতো',
    color: 'border-emerald-400 bg-emerald-50',
    badge: 'bg-emerald-500',
    desc: 'No visible scratches. Fully functional. Original accessories included.',
    descBn: 'কোনো আঁচড় নেই। সব আনুষাঙ্গিক সহ।',
  },
  {
    grade: 'A', name: 'Excellent', nameBn: 'চমৎকার',
    color: 'border-blue-400 bg-blue-50',
    badge: 'bg-blue-500',
    desc: 'Minor cosmetic marks only. All functions work perfectly.',
    descBn: 'সামান্য দাগ। সব ফাংশন ঠিকঠাক।',
  },
  {
    grade: 'B', name: 'Good', nameBn: 'ভালো',
    color: 'border-amber-400 bg-amber-50',
    badge: 'bg-amber-500',
    desc: 'Visible light scratches. Fully functional at a great discount.',
    descBn: 'হালকা আঁচড়। দারুণ ডিসকাউন্ট।',
  },
  {
    grade: 'C', name: 'Fair', nameBn: 'ঠিক আছে',
    color: 'border-gray-400 bg-gray-50',
    badge: 'bg-gray-500',
    desc: 'Heavy marks but fully functional. Best value pick.',
    descBn: 'বেশি দাগ কিন্তু সম্পূর্ণ কার্যকর। সেরা দাম।',
  },
];

const SELL_STEPS = [
  { step: '01', icon: '📸', title: 'List Your Item', titleBn: 'পণ্য লিস্ট করুন', desc: 'Upload photos & set your price — takes 2 minutes', descBn: 'ছবি আপলোড করুন ও দাম দিন — মাত্র ২ মিনিট' },
  { step: '02', icon: '💬', title: 'Get Offers', titleBn: 'অফার পান', desc: 'Buyers message you directly with instant offers', descBn: 'ক্রেতারা সরাসরি অফার পাঠাবে' },
  { step: '03', icon: '📦', title: 'Ship or Meet', titleBn: 'পাঠান বা দেখা করুন', desc: 'We handle pickup & delivery or local meetup', descBn: 'আমরা পিকআপ করব বা স্থানীয় মিটআপ' },
  { step: '04', icon: '💵', title: 'Get Paid', titleBn: 'পেমেন্ট পান', desc: 'Instant bKash / bank transfer once delivered', descBn: 'ডেলিভারির পরেই বিকাশ / ব্যাংকে পেমেন্ট' },
];

const TRUSTED_BRANDS = [
  { name: 'Samsung', emoji: '📱', deals: '120+ deals' },
  { name: 'Apple', emoji: '🍎', deals: '85+ deals' },
  { name: 'Xiaomi', emoji: '📲', deals: '200+ deals' },
  { name: 'HP / Dell', emoji: '💻', deals: '60+ deals' },
  { name: 'ASUS', emoji: '🖥️', deals: '45+ deals' },
  { name: 'Sony', emoji: '🎮', deals: '30+ deals' },
];

export default function RecommercePage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #6366f1 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {['♻️','🔄','♻️','🌿','♻️'].map((e, i) => (
            <span key={i} className="absolute text-6xl" style={{ top: `${10 + i * 18}%`, left: `${3 + i * 22}%`, opacity: 0.5 }}>{e}</span>
          ))}
        </div>
        <div className="container py-12 sm:py-16 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-indigo-400/20 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30">
              ♻️ BUY SMART • SELL EASY • SAVE MORE
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">
            Recommerce ♻️<br />
            <span className="text-indigo-300">Buy Pre-owned. Sell Yours.</span>
          </h1>
          <p className="text-indigo-200 text-base sm:text-lg mb-8 max-w-xl">
            Certified refurbished electronics, pre-loved fashion, used books & more — all quality-checked, warranted, and priced to save.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products?condition=refurbished" className="inline-flex items-center gap-2 bg-white text-indigo-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <RefreshCw className="h-4 w-4" /> Shop Refurbished
            </Link>
            <Link href="/publish" className="inline-flex items-center gap-2 bg-indigo-400/20 border border-indigo-400/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-400/30 transition-colors">
              <Banknote className="h-4 w-4" /> Sell Your Item
            </Link>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="container -mt-6 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, label: 'Quality Certified', sub: 'Every item inspected', color: 'text-green-500', bg: 'bg-green-50' },
            { icon: RefreshCw,   label: 'Easy Returns',     sub: '7-day return policy',  color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Banknote,    label: 'Secure Payment',   sub: 'bKash, card & COD',    color: 'text-amber-500', bg: 'bg-amber-50' },
            { icon: Star,        label: 'Seller Ratings',   sub: 'Verified reviews',     color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map(f => (
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

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">Shop by Category</h2>
              <p className="text-sm text-gray-500 mt-0.5">All items quality-graded & verified</p>
            </div>
            <Link href="/products?condition=refurbished" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.label} href={cat.href}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3 text-center hover:shadow-lg transition-all hover:-translate-y-0.5">
                <span className="text-4xl">{cat.emoji}</span>
                <p className="font-bold text-sm text-gray-800 leading-tight">{cat.label}</p>
                <span className={`text-[10px] font-black ${cat.badgeColor} text-white px-2 py-0.5 rounded-full`}>
                  {cat.badge}
                </span>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Condition grades */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Our Quality Grades</h2>
          <p className="text-sm text-gray-500 mb-5">Every product is inspected and graded by our team before listing.</p>
          <div className="grid sm:grid-cols-4 gap-4">
            {GRADES.map(g => (
              <div key={g.grade} className={`rounded-2xl border-2 ${g.color} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm ${g.badge}`}>
                    {g.grade}
                  </span>
                  <span className="font-bold text-gray-800">{g.name}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two column: Sell yours + Popular brands */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Sell yours */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-lg overflow-hidden">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}>
              <h2 className="text-lg font-black text-white">Sell Your Items</h2>
              <p className="text-indigo-300 text-sm mt-0.5">Turn unused stuff into cash — safely & quickly</p>
            </div>
            <div className="p-6 space-y-4">
              {SELL_STEPS.map(s => (
                <div key={s.step} className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="/publish"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-bold py-3 text-sm hover:bg-indigo-700 transition-colors mt-2">
                Start Selling <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Popular verified brands */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-lg overflow-hidden">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #065f46, #059669)' }}>
              <h2 className="text-lg font-black text-white">Top Brands — Refurbished</h2>
              <p className="text-emerald-300 text-sm mt-0.5">Certified quality, fraction of original price</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {TRUSTED_BRANDS.map(b => (
                  <Link key={b.name} href={`/products?condition=refurbished&brand=${b.name}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 hover:shadow-sm hover:border-gray-200 transition-all group">
                    <span className="text-xl">{b.emoji}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.deals}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/products?condition=refurbished"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-700 font-bold py-3 text-sm hover:bg-emerald-50 transition-colors">
                Browse All Refurbished <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Why recommerce */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6 text-center">Why Buy Recommerce?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '💰', title: 'Save up to 70%', titleBn: '৭০% পর্যন্ত সাশ্রয়', desc: 'Get premium brands at a fraction of the retail price', descBn: 'বড় ব্র্যান্ড অনেক কম দামে' },
              { emoji: '🌍', title: 'Eco-Friendly', titleBn: 'পরিবেশবান্ধব', desc: 'Extend product life and reduce electronic waste', descBn: 'পণ্যের আয়ু বাড়ান ও ই-বর্জ্য কমান' },
              { emoji: '✅', title: 'Certified Quality', titleBn: 'সার্টিফাইড গুণমান', desc: 'Every item tested, graded & backed by warranty', descBn: 'প্রতিটি পণ্য পরীক্ষিত ও ওয়ারেন্টি সহ' },
            ].map(r => (
              <div key={r.title} className="flex flex-col items-center text-center gap-3">
                <span className="text-4xl">{r.emoji}</span>
                <div>
                  <p className="font-black text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, label: '7-Day Return', desc: 'Not satisfied? Return easily.', color: 'text-green-600', bg: 'bg-green-50' },
            { icon: CheckCircle2, label: '90-Day Warranty', desc: 'On all certified electronics.', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: RefreshCw, label: 'Easy Exchange', desc: 'Swap for another grade.', color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Banknote, label: 'Secure Escrow', desc: 'Money held until delivered.', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(g => (
            <div key={g.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 ${g.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <g.icon className={`h-5 w-5 ${g.color}`} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{g.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}>
          <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-white mb-2">Ready to start?</h3>
              <p className="text-indigo-300 text-sm">Join thousands of smart buyers & sellers on Unkora Recommerce.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/products?condition=refurbished"
                className="inline-flex items-center gap-2 bg-white text-indigo-800 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">
                <RefreshCw className="h-4 w-4" /> Browse Deals
              </Link>
              <Link href="/publish"
                className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/50 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-500/40 transition-colors">
                <Banknote className="h-4 w-4" /> List an Item
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
