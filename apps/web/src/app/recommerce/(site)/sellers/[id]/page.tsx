'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Star, Package, CheckCircle, Clock, MapPin, MessageSquare, Shield } from 'lucide-react';
import { RECOMMERCE_CATEGORIES, GRADE_META } from '../../../_constants/categories';

const MOCK_SELLER = {
  id: 'S001',
  name: 'Rahim Ahmed',
  nameBn: 'রহিম আহমেদ',
  location: 'ঢাকা, মিরপুর',
  joinedBn: '২০২৩ সাল থেকে',
  joinedEn: 'Since 2023',
  bio: 'Electronics enthusiast. I sell quality pre-owned gadgets at fair prices. All items tested before listing.',
  bioBn: 'ইলেকট্রনিক্স বিশেষজ্ঞ। মানসম্পন্ন পুরানো গ্যাজেট ন্যায্য মূল্যে বিক্রি করি। সব পণ্য লিস্টিং করার আগে পরীক্ষা করা হয়।',
  rating: 4.7,
  reviewCount: 23,
  totalSales: 12,
  responseTimeBn: 'সাধারণত ১ ঘণ্টার মধ্যে',
  responseTimeEn: 'Usually within 1 hour',
  verified: true,
};

const SELLER_LISTINGS = [
  { id: 1, title: 'Samsung Galaxy S21',  titleBn: 'স্যামসাং গ্যালাক্সি S21',  price: 28000, grade: 'A' as const,  cat: 'electronics', views: 89 },
  { id: 5, title: 'iPhone 13 Pro',        titleBn: 'আইফোন ১৩ প্রো',             price: 65000, grade: 'A+' as const, cat: 'electronics', views: 210 },
  { id: 9, title: 'Office Chair',         titleBn: 'অফিস চেয়ার',                price: 6500,  grade: 'A' as const,  cat: 'furniture',   views: 43 },
];

const REVIEWS = [
  { id: 1, buyer: 'Kamal H.',   rating: 5, comment: 'Great seller! Item was exactly as described. Fast response.', date: '2026-06-10' },
  { id: 2, buyer: 'Sadia R.',   rating: 4, comment: 'Good condition phone, fair price. Recommended.', date: '2026-05-28' },
  { id: 3, buyer: 'Tariq M.',   rating: 5, comment: 'Very honest seller. Will buy again.', date: '2026-05-15' },
];

export default function SellerProfilePage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [tab, setTab]   = useState<'listings' | 'reviews'>('listings');

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/recommerce/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {L('বিজ্ঞাপনে ফিরুন', 'Back to Listings')}
        </Link>

        {/* Seller card */}
        <div className="bg-white rounded-3xl border p-6 mb-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl font-black text-amber-700 flex-shrink-0">
              {MOCK_SELLER.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-gray-900">{L(MOCK_SELLER.nameBn, MOCK_SELLER.name)}</h1>
                {MOCK_SELLER.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> {L('যাচাইকৃত', 'Verified')}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {MOCK_SELLER.location}
                <span className="mx-1.5">·</span>
                <Clock className="w-3.5 h-3.5" /> {L(MOCK_SELLER.joinedBn, MOCK_SELLER.joinedEn)}
              </p>

              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{L(MOCK_SELLER.bioBn, MOCK_SELLER.bio)}</p>

              {/* Stats */}
              <div className="flex gap-5 mt-4">
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" /> {MOCK_SELLER.rating}
                  </p>
                  <p className="text-[11px] text-gray-500">{MOCK_SELLER.reviewCount} {L('রিভিউ', 'reviews')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{MOCK_SELLER.totalSales}</p>
                  <p className="text-[11px] text-gray-500">{L('সফল বিক্রয়', 'sales')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{SELLER_LISTINGS.length}</p>
                  <p className="text-[11px] text-gray-500">{L('সক্রিয় তালিকা', 'active')}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link href={`/recommerce/login?as=buyer`}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <MessageSquare className="w-4 h-4" />
                {L('বার্তা দিন', 'Message')}
              </Link>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 justify-center">
                <Clock className="w-3 h-3" /> {L(MOCK_SELLER.responseTimeBn, MOCK_SELLER.responseTimeEn)}
              </div>
            </div>
          </div>

          {/* Safety tip */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              {L('নিরাপদ লেনদেনের জন্য পরিচিত স্থানে দেখা করুন। অগ্রিম পেমেন্ট করবেন না।', 'Meet in a public place for safety. Never pay in advance.')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="flex border-b">
            {([
              { key: 'listings', icon: Package,      labelBn: 'বিজ্ঞাপন',  labelEn: 'Listings' },
              { key: 'reviews',  icon: Star,         labelBn: 'রিভিউ',      labelEn: 'Reviews' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                  tab === t.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <t.icon className="w-4 h-4" />
                {L(t.labelBn, t.labelEn)}
              </button>
            ))}
          </div>

          {/* Listings tab */}
          {tab === 'listings' && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {SELLER_LISTINGS.map(item => {
                const grade = GRADE_META[item.grade];
                const catEmoji = RECOMMERCE_CATEGORIES.find(c => c.slug === item.cat)?.emoji ?? '📦';
                return (
                  <Link key={item.id} href={`/recommerce/listings/${item.id}`}
                    className="bg-gray-50 rounded-2xl border hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-3xl opacity-25">{catEmoji}</span>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {lang === 'bn' ? item.titleBn : item.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-600">৳ {item.price.toLocaleString('bn-BD')}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${grade.color}`}>{item.grade}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Reviews tab */}
          {tab === 'reviews' && (
            <div className="divide-y">
              {REVIEWS.map(r => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {r.buyer.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{r.buyer}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{r.comment}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{r.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lang toggle */}
      <div className="text-center pb-8">
        <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
          className="text-xs text-gray-400 hover:text-amber-600 transition-colors border rounded-full px-3 py-1">
          {lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
        </button>
      </div>
    </div>
  );
}
