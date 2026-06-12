'use client';

import { useState } from 'react';
import { Gift, Copy, Check, Users, TrendingUp, Star } from 'lucide-react';

const REFERRALS = [
  { id: 1, name: 'রাফিউল ইসলাম', date: '১০ জুন, ২০২৬', status: 'completed', earned: 200 },
  { id: 2, name: 'নাসরিন আক্তার', date: '২৫ মে, ২০২৬', status: 'completed', earned: 200 },
  { id: 3, name: 'করিম হোসেন',   date: '১৫ মে, ২০২৬', status: 'pending',   earned: 0   },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const refCode = 'UNKORA-RF4821';
  const refLink = `https://unkora.com/r/${refCode}`;

  const copy = () => {
    navigator.clipboard.writeText(refLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">রেফারেল প্রোগ্রাম</h1>
        <p className="text-sm text-gray-500 mt-0.5">বন্ধুকে রেফার করুন এবং পুরস্কার পান</p>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="text-xl font-black mb-1">প্রতিটি রেফারেলে ৳200</h2>
          <p className="text-sm text-white/80 mb-4">বন্ধু যখন প্রথম অর্ডার করবেন, আপনি ২০০ পয়েন্ট পাবেন। আপনার বন্ধুও ৳100 ছাড় পাবেন।</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between gap-3">
            <span className="text-sm font-mono font-bold truncate">{refLink}</span>
            <button onClick={copy}
              className="flex items-center gap-1.5 bg-white text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors flex-shrink-0">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'কপি হয়েছে' : 'কপি'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users,    label: 'মোট রেফার',   value: '3',     color: 'text-blue-600 bg-blue-50' },
          { icon: TrendingUp,label: 'সফল রেফার',  value: '2',     color: 'text-green-600 bg-green-50' },
          { icon: Star,     label: 'পয়েন্ট আয়',  value: '400',   color: 'text-amber-600 bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">কীভাবে কাজ করে</h2>
        <div className="space-y-3">
          {[
            { step: '১', title: 'লিংক শেয়ার করুন', desc: 'আপনার রেফারেল লিংক বন্ধু ও পরিবারের সাথে শেয়ার করুন' },
            { step: '২', title: 'বন্ধু রেজিস্টার করুন', desc: 'বন্ধু আপনার লিংক ব্যবহার করে অ্যাকাউন্ট তৈরি করবেন' },
            { step: '৩', title: 'পুরস্কার পান', desc: 'বন্ধু প্রথম অর্ডার করলে আপনি ২০০ পয়েন্ট পাবেন' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">রেফারেল ইতিহাস</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {REFERRALS.map(r => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-[11px] text-gray-400">{r.date}</p>
                </div>
              </div>
              <div className="text-right">
                {r.status === 'completed' ? (
                  <p className="text-sm font-black text-green-600">+{r.earned} pts</p>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">মুলতবি</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3">শেয়ার করুন</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'WhatsApp', color: 'bg-green-500', emoji: '💬' },
            { label: 'Facebook', color: 'bg-blue-600',  emoji: '📘' },
            { label: 'কপি',      color: 'bg-gray-700',  emoji: '🔗' },
          ].map(s => (
            <button key={s.label} onClick={s.label === 'কপি' ? copy : undefined}
              className={`${s.color} text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity`}>
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
