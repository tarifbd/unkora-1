'use client';

import { useState } from 'react';
import { Shield, Key, Smartphone, Globe, LogOut, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const SESSIONS = [
  { id: 1, device: 'Chrome · Windows 11',    location: 'ঢাকা, বাংলাদেশ',    time: 'এখন সক্রিয়',      current: true  },
  { id: 2, device: 'Samsung Browser · Android', location: 'চট্টগ্রাম, বাংলাদেশ', time: '২ দিন আগে',       current: false },
  { id: 3, device: 'Safari · iPhone 15',     location: 'সিলেট, বাংলাদেশ',    time: '৫ দিন আগে',       current: false },
];

export default function SecurityPage() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">নিরাপত্তা</h1>
        <p className="text-sm text-gray-500 mt-0.5">আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন</p>
      </div>

      {/* Security score */}
      <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-2xl border border-primary/20 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900">নিরাপত্তা স্কোর</p>
              <p className="text-2xl font-black text-primary">৭৫ / ১০০</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">উন্নতির জন্য</p>
            <p className="text-xs font-semibold text-amber-600">2FA চালু করুন</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full" style={{ width: '75%' }} />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" /> পাসওয়ার্ড পরিবর্তন
        </h2>
        {[
          { label: 'বর্তমান পাসওয়ার্ড', show: showOld, toggle: () => setShowOld(!showOld) },
          { label: 'নতুন পাসওয়ার্ড',    show: showNew, toggle: () => setShowNew(!showNew) },
          { label: 'নিশ্চিত করুন',        show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
            <div className="relative">
              <input type={f.show ? 'text' : 'password'} placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        <div className="space-y-1">
          {['কমপক্ষে ৮ অক্ষর', 'বড় ও ছোট হাতের অক্ষর', 'অন্তত একটি সংখ্যা'].map(rule => (
            <div key={rule} className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle className="w-3 h-3 text-gray-300" /> {rule}
            </div>
          ))}
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className={cn('w-full py-2.5 rounded-xl text-sm font-bold transition-all',
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90')}>
          {saved ? '✓ আপডেট হয়েছে' : 'পাসওয়ার্ড আপডেট করুন'}
        </button>
      </div>

      {/* 2FA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">দুই-স্তর যাচাইকরণ (2FA)</p>
              <p className="text-xs text-gray-500 mt-0.5">লগইনের সময় OTP যাচাই করুন</p>
              {twoFAEnabled && (
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> সক্রিয়
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setTwoFAEnabled(!twoFAEnabled)}
            className={cn('relative rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0',
              twoFAEnabled ? 'bg-primary' : 'bg-gray-200')}
            style={{ width: 44, height: 26 }}>
            <span className={cn('absolute top-1 bg-white rounded-full shadow transition-all duration-200')}
              style={{ width: 18, height: 18, left: twoFAEnabled ? 24 : 4, top: 4 }} />
          </button>
        </div>
        {twoFAEnabled && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700">ফোন নম্বর: +880 1X***-XX901</p>
            <p className="text-xs text-emerald-600 mt-0.5">প্রতিটি লগইনে SMS-এ OTP পাঠানো হবে</p>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> সক্রিয় সেশন
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {SESSIONS.map(s => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', s.current ? 'bg-green-500' : 'bg-gray-300')} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.device}</p>
                  <p className="text-[11px] text-gray-400">{s.location} · {s.time}</p>
                </div>
              </div>
              {!s.current && (
                <button className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> সরান
                </button>
              )}
              {s.current && <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">এই ডিভাইস</span>}
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-50">
          <button className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> সব সেশন সাইন আউট করুন
          </button>
        </div>
      </div>
    </div>
  );
}
