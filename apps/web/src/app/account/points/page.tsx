'use client';

import { Star, Gift, ArrowRight, Zap, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LEVELS = [
  { name: 'Bronze',   min: 0,    max: 999,  color: 'text-amber-700 bg-amber-50  border-amber-200', icon: '🥉' },
  { name: 'Silver',   min: 1000, max: 4999, color: 'text-gray-500 bg-gray-50   border-gray-200',  icon: '🥈' },
  { name: 'Gold',     min: 5000, max: 14999,color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '🥇' },
  { name: 'Platinum', min: 15000,max: Infinity, color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '💎' },
];

const HISTORY = [
  { id: 1, label: 'অর্ডার #ORD-4488 সম্পন্ন',   pts: +320, date: '১০ জুন' },
  { id: 2, label: 'রিভিউ দেওয়ার জন্য বোনাস',      pts: +50,  date: '৮ জুন' },
  { id: 3, label: 'পয়েন্ট রিডিম (৳100 ছাড়)',     pts: -200, date: '5 জুন' },
  { id: 4, label: 'অর্ডার #ORD-4350 সম্পন্ন',    pts: +210, date: '২৮ মে' },
  { id: 5, label: 'প্রথম অর্ডার বোনাস',            pts: +100, date: '১৫ মে' },
];

const REWARDS = [
  { pts: 200,  label: '৳100 ছাড়',       icon: '🎟️' },
  { pts: 500,  label: '৳300 ছাড়',       icon: '💰' },
  { pts: 1000, label: '৳700 ছাড়',       icon: '🎁' },
  { pts: 2000, label: 'ফ্রি শিপিং',     icon: '🚚' },
];

export default function PointsPage() {
  const currentPts = 480;
  const level = LEVELS.find(l => currentPts >= l.min && currentPts <= l.max) ?? LEVELS[0]!;
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progress = nextLevel ? ((currentPts - level.min) / (nextLevel.min - level.min)) * 100 : 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">ক্লাব পয়েন্ট</h1>
        <p className="text-sm text-gray-500 mt-0.5">পয়েন্ট জমান এবং বিশেষ পুরস্কার পান</p>
      </div>

      {/* Points card */}
      <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/70 mb-0.5">মোট পয়েন্ট</p>
              <p className="text-4xl font-black">{currentPts.toLocaleString()}</p>
              <p className="text-xs text-white/70 mt-1">≈ ৳{Math.floor(currentPts / 2)} এর সমান</p>
            </div>
            <div className={cn('px-3 py-1.5 rounded-xl border text-sm font-bold', level.color)}>
              {level.icon} {level.name}
            </div>
          </div>
          {nextLevel && (
            <div>
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span>{level.name}</span>
                <span>{nextLevel.min - currentPts} পয়েন্ট বাকি → {nextLevel.name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards to redeem */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" /> পুরস্কার রিডিম
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {REWARDS.map(r => {
            const canRedeem = currentPts >= r.pts;
            return (
              <div key={r.pts} className={cn('rounded-xl border p-3 text-center transition-all',
                canRedeem ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 cursor-pointer' : 'border-gray-100 bg-gray-50 opacity-60')}>
                <div className="text-2xl mb-1">{r.icon}</div>
                <p className="text-xs font-bold text-gray-900">{r.label}</p>
                <p className={cn('text-[11px] font-semibold mt-1', canRedeem ? 'text-amber-600' : 'text-gray-400')}>
                  {r.pts} pts
                </p>
                {!canRedeem && <Lock className="w-3 h-3 text-gray-300 mx-auto mt-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Earn more tips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> আরও পয়েন্ট পান
        </h2>
        <div className="space-y-2">
          {[
            { label: 'অর্ডার করুন', desc: 'প্রতি ৳100 খরচে ১০ পয়েন্ট', pts: '১০ pts/৳100', href: '/' },
            { label: 'রিভিউ দিন', desc: 'প্রতিটি রিভিউর জন্য ৫০ পয়েন্ট', pts: '৫০ pts', href: '/account/reviews' },
            { label: 'বন্ধু রেফার করুন', desc: 'সফল রেফারেলে ২০০ পয়েন্ট', pts: '২০০ pts', href: '/account/referrals' },
          ].map(tip => (
            <Link key={tip.label} href={tip.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-50 hover:border-gray-100 transition-colors group">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{tip.label}</p>
                <p className="text-xs text-gray-400">{tip.desc}</p>
              </div>
              <span className="text-xs font-bold text-primary">{tip.pts}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> পয়েন্ট ইতিহাস
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {HISTORY.map(h => (
            <div key={h.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-900">{h.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{h.date}</p>
              </div>
              <span className={cn('text-sm font-black', h.pts > 0 ? 'text-green-600' : 'text-red-500')}>
                {h.pts > 0 ? '+' : ''}{h.pts} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
