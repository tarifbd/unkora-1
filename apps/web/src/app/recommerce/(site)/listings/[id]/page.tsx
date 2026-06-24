'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Phone, Heart, Share2, Eye, MapPin, Clock, Shield, Star, Flag } from 'lucide-react';
import { RECOMMERCE_CATEGORIES, GRADE_META } from '../../../_constants/categories';

const MOCK_LISTING = {
  id: 1,
  title: 'Samsung Galaxy S21',
  titleBn: 'স্যামসাং গ্যালাক্সি S21',
  price: 28000,
  grade: 'A' as const,
  cat: 'electronics',
  location: 'ঢাকা, মিরপুর',
  views: 89,
  postedAgo: '২ দিন আগে',
  postedAgoEn: '2 days ago',
  descBn: 'স্যামসাং গ্যালাক্সি S21, ৬.২ ইঞ্চি স্ক্রিন, ১২৮GB স্টোরেজ, ৮GB RAM। ব্যাটারি স্বাস্থ্য ৯২%। সব আনুষাঙ্গিক সহ। কোনো ক্র্যাক বা স্ক্র্যাচ নেই।',
  descEn: 'Samsung Galaxy S21, 6.2" screen, 128GB storage, 8GB RAM. Battery health 92%. All accessories included. No cracks or scratches.',
  specs: [
    { labelBn: 'ব্র্যান্ড',     labelEn: 'Brand',    value: 'Samsung' },
    { labelBn: 'মডেল',          labelEn: 'Model',    value: 'Galaxy S21' },
    { labelBn: 'স্টোরেজ',      labelEn: 'Storage',  value: '128GB' },
    { labelBn: 'RAM',           labelEn: 'RAM',      value: '8GB' },
    { labelBn: 'ব্যাটারি',      labelEn: 'Battery',  value: '92%' },
    { labelBn: 'রঙ',            labelEn: 'Color',    value: 'Phantom Gray' },
  ],
  seller: {
    name: 'Rahim Ahmed',
    nameBn: 'রহিম আহমেদ',
    joinedBn: '২০২৩ থেকে সদস্য',
    joinedEn: 'Member since 2023',
    totalSales: 12,
    rating: 4.7,
    responseTimeBn: 'সাধারণত ১ ঘণ্টার মধ্যে',
    responseTimeEn: 'Usually within 1 hour',
  },
};

export default function ListingDetailPage() {
  const [lang, setLang]   = useState<'bn' | 'en'>('bn');
  const [saved, setSaved] = useState(false);

  const item = MOCK_LISTING;
  const grade = GRADE_META[item.grade];
  const catEmoji = RECOMMERCE_CATEGORIES.find(c => c.slug === item.cat)?.emoji ?? '📦';
  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/recommerce/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {L('সব বিজ্ঞাপন', 'All Listings')}
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: image + details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image gallery */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-8xl opacity-20">{catEmoji}</span>
              </div>
              <div className="flex gap-2 p-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-transparent hover:border-amber-400 cursor-pointer transition-colors">
                    <span className="text-xl opacity-30">{catEmoji}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-gray-900">{L(item.titleBn, item.title)}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${grade.color}`}>
                      {item.grade} — {L(grade.label, grade.labelEn)}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.views} {L('ভিউ', 'views')}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-amber-600">৳ {item.price.toLocaleString('bn-BD')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {L(item.postedAgo, item.postedAgoEn)}</span>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-black text-gray-700 mb-2">{L('বিবরণ', 'Description')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{L(item.descBn, item.descEn)}</p>
              </div>

              {/* Specs */}
              <div>
                <p className="text-sm font-black text-gray-700 mb-2">{L('বিস্তারিত তথ্য', 'Specifications')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {item.specs.map(spec => (
                    <div key={spec.value} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-gray-500 font-semibold">{L(spec.labelBn, spec.labelEn)}</span>
                      <span className="text-gray-900 font-bold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {L('নিরাপদ লেনদেনের জন্য পরিচিত স্থানে দেখা করুন। অগ্রিম পেমেন্ট করবেন না।', 'Meet in a public place for safety. Never pay in advance.')}
                </p>
              </div>
            </div>

            {/* Action row mobile */}
            <div className="lg:hidden flex gap-3">
              <button onClick={() => setSaved(s => !s)}
                className={`p-3 rounded-xl border transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white text-gray-400 hover:text-red-400'}`}>
                <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
              <Link href={`/recommerce/login?as=buyer`}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {L('বার্তা পাঠান', 'Send Message')}
              </Link>
            </div>
          </div>

          {/* Right: seller card + actions */}
          <div className="space-y-4">
            {/* Seller card */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <Link href="/recommerce/sellers/S001" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl font-black text-amber-700">
                  {item.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 hover:text-amber-700 transition-colors">{L(item.seller.nameBn, item.seller.name)}</p>
                  <p className="text-[11px] text-gray-400">{L(item.seller.joinedBn, item.seller.joinedEn)}</p>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-lg font-black text-gray-900">{item.seller.totalSales}</p>
                  <p className="text-[11px] text-gray-500">{L('বিক্রয়', 'Sales')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-lg font-black text-gray-900 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {item.seller.rating}
                  </p>
                  <p className="text-[11px] text-gray-500">{L('রেটিং', 'Rating')}</p>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {L(item.seller.responseTimeBn, item.seller.responseTimeEn)}
              </p>

              {/* CTA buttons */}
              <div className="space-y-2">
                <Link href={`/recommerce/login?as=buyer`}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {L('বার্তা পাঠান', 'Send Message')}
                </Link>
                <Link href={`/recommerce/login?as=buyer`}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  {L('ফোন নম্বর দেখুন', 'Show Phone Number')}
                </Link>
              </div>

              {/* Save / share */}
              <div className="flex gap-2 pt-1 border-t">
                <button onClick={() => setSaved(s => !s)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'hover:bg-gray-50 text-gray-500'}`}>
                  <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                  {L('সেভ করুন', 'Save')}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:bg-gray-50 text-gray-500 transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  {L('শেয়ার করুন', 'Share')}
                </button>
              </div>
            </div>

            {/* Report */}
            <button className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors py-1.5">
              <Flag className="w-3.5 h-3.5" />
              {L('রিপোর্ট করুন', 'Report this listing')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
