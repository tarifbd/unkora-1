'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, ArrowRight, Shield, Star, Zap } from 'lucide-react';
import { RECOMMERCE_CATEGORIES, GRADE_META } from '../_constants/categories';

const FEATURED_LISTINGS = [
  { id: 1, title: 'Samsung Galaxy S21',    titleBn: 'স্যামসাং গ্যালাক্সি S21',  price: 28000, grade: 'A' as const,  cat: 'electronics', img: null, location: 'ঢাকা',       views: 89 },
  { id: 2, title: 'Dell Laptop Core i5',   titleBn: 'ডেল ল্যাপটপ Core i5',       price: 35000, grade: 'B' as const,  cat: 'electronics', img: null, location: 'চট্টগ্রাম', views: 45 },
  { id: 3, title: 'Sony Smart TV 43"',     titleBn: 'সনি স্মার্ট টিভি ৪৩"',      price: 22000, grade: 'A+' as const, cat: 'electronics', img: null, location: 'ঢাকা',       views: 134 },
  { id: 4, title: 'Dining Table Set',      titleBn: 'ডাইনিং টেবিল সেট',          price: 12000, grade: 'B' as const,  cat: 'furniture',   img: null, location: 'সিলেট',      views: 67 },
  { id: 5, title: 'iPhone 13 Pro',         titleBn: 'আইফোন ১৩ প্রো',             price: 65000, grade: 'A+' as const, cat: 'electronics', img: null, location: 'ঢাকা',       views: 210 },
  { id: 6, title: 'Yamaha Acoustic Guitar',titleBn: 'ইয়ামাহা গিটার',             price: 8500,  grade: 'A' as const,  cat: 'others',      img: null, location: 'ঢাকা',       views: 52 },
  { id: 7, title: 'Baby Stroller',         titleBn: 'বেবি স্ট্রলার',              price: 4500,  grade: 'A' as const,  cat: 'kids',        img: null, location: 'রাজশাহী',   views: 38 },
  { id: 8, title: 'Cricket Bat & Kit',     titleBn: 'ক্রিকেট ব্যাট ও কিট',       price: 3200,  grade: 'B' as const,  cat: 'sports',      img: null, location: 'ঢাকা',       views: 91 },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '📸', titleBn: 'ছবি তুলুন', titleEn: 'Take Photos',      descBn: 'পণ্যের ভালো ছবি তুলুন',           descEn: 'Take clear photos of your item' },
  { step: '02', icon: '📝', titleBn: 'বিজ্ঞাপন দিন', titleEn: 'Post Ad',        descBn: 'বিস্তারিত তথ্য দিয়ে বিজ্ঞাপন দিন', descEn: 'Add details and post your listing' },
  { step: '03', icon: '💬', titleBn: 'ক্রেতার সাথে কথা বলুন', titleEn: 'Chat', descBn: 'আগ্রহী ক্রেতার সাথে যোগাযোগ করুন',  descEn: 'Connect with interested buyers' },
  { step: '04', icon: '💰', titleBn: 'বিক্রি করুন', titleEn: 'Sell & Earn',    descBn: 'নিরাপদে পণ্য হস্তান্তর করুন',      descEn: 'Hand over safely and get paid' },
];

export default function RecommercePage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [search, setSearch] = useState('');

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold">
            ♻️ {L('বাংলাদেশের সেরা পুরানো পণ্যের বাজার', "Bangladesh's Best Pre-Owned Marketplace")}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">
            {L('পুরানো পণ্য কিনুন,\nভালো দামে বিক্রি করুন', 'Buy & Sell\nPre-Owned Goods')}
          </h1>
          <p className="text-amber-100 text-base sm:text-lg max-w-xl mx-auto">
            {L('সহজে বিজ্ঞাপন দিন, নিরাপদে কেনাবেচা করুন', 'Post ads easily, trade safely')}
          </p>

          {/* Search */}
          <div className="flex max-w-2xl mx-auto gap-0 shadow-xl rounded-2xl overflow-hidden">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L('কী খুঁজছেন?', 'What are you looking for?')}
              className="flex-1 px-5 py-4 text-gray-900 text-base outline-none"
            />
            <button
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 flex items-center gap-2 font-bold transition-colors"
              onClick={() => window.location.href = `/recommerce/listings${search ? `?q=${encodeURIComponent(search)}` : ''}`}
            >
              <Search className="w-5 h-5" />
              {L('খুঁজুন', 'Search')}
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-amber-100">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {L('নিরাপদ লেনদেন', 'Safe Trading')}</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {L('বিনামূল্যে বিজ্ঞাপন', 'Free Listings')}</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {L('যাচাইকৃত বিক্রেতা', 'Verified Sellers')}</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900">{L('বিভাগ অনুযায়ী খুঁজুন', 'Browse by Category')}</h2>
          <Link href="/recommerce/listings" className="text-sm text-amber-600 font-bold flex items-center gap-1 hover:underline">
            {L('সব দেখুন', 'View all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
          {RECOMMERCE_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/recommerce/listings?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">
                {lang === 'bn' ? cat.labelBn : cat.labelEn}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900">{L('সাম্প্রতিক বিজ্ঞাপন', 'Recent Listings')}</h2>
          <Link href="/recommerce/listings" className="text-sm text-amber-600 font-bold flex items-center gap-1 hover:underline">
            {L('আরো দেখুন', 'See more')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {FEATURED_LISTINGS.map(item => {
            const grade = GRADE_META[item.grade];
            return (
              <Link
                key={item.id}
                href={`/recommerce/listings/${item.id}`}
                className="bg-white rounded-2xl border hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
              >
                {/* Image placeholder */}
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-4xl opacity-30">
                    {RECOMMERCE_CATEGORIES.find(c => c.slug === item.cat)?.emoji ?? '📦'}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {lang === 'bn' ? item.titleBn : item.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-amber-600">৳ {item.price.toLocaleString('bn-BD')}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${grade.color}`}>
                      {item.grade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>📍 {item.location}</span>
                    <span>👁 {item.views}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-gray-900 text-center mb-8">{L('কীভাবে কাজ করে?', 'How It Works')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className="text-center space-y-2">
                <div className="relative inline-block">
                  <div className="w-14 h-14 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center text-2xl mx-auto">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800">{L(s.titleBn, s.titleEn)}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{L(s.descBn, s.descEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white text-center space-y-4">
          <h2 className="text-2xl font-black">{L('আজই বিজ্ঞাপন দিন — সম্পূর্ণ বিনামূল্যে!', 'Post Your Ad Today — Completely Free!')}</h2>
          <p className="text-amber-100 text-sm">{L('লক্ষাধিক ক্রেতার কাছে আপনার পণ্য পৌঁছান', 'Reach millions of potential buyers')}</p>
          <Link
            href="/recommerce/post-ad"
            className="inline-flex items-center gap-2 bg-white text-amber-600 font-black px-8 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
          >
            {L('বিজ্ঞাপন দিন', 'Post Free Ad')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
