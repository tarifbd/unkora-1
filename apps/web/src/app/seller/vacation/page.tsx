'use client';

import { useState } from 'react';
import { Palmtree, Calendar, MessageSquare, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '১ সপ্তাহ',   days: 7  },
  { label: '২ সপ্তাহ',   days: 14 },
  { label: '১ মাস',       days: 30 },
  { label: 'কাস্টম',      days: 0  },
];

export default function VacationPage() {
  const [enabled, setEnabled] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('আমি বর্তমানে ছুটিতে আছি। আপনার অর্ডার ফিরে আসার পরে প্রক্রিয়া করা হবে। অসুবিধার জন্য ক্ষমাপ্রার্থী।');
  const [pauseNewOrders, setPauseNewOrders] = useState(true);
  const [saved, setSaved] = useState(false);

  const applyPreset = (days: number) => {
    if (days === 0) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    setStartDate(start.toISOString().split('T')[0]!);
    setEndDate(end.toISOString().split('T')[0]!);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">ভ্যাকেশন মোড</h1>
        <p className="text-sm text-gray-500 mt-0.5">ছুটির সময় শপ পরিচালনা নিয়ন্ত্রণ করুন</p>
      </div>

      {/* Main toggle */}
      <div className={cn('rounded-2xl border p-5 transition-all', enabled ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', enabled ? 'bg-amber-100' : 'bg-gray-100')}>
              <Palmtree className={cn('w-6 h-6', enabled ? 'text-amber-500' : 'text-gray-400')} />
            </div>
            <div>
              <p className="font-bold text-gray-900">ভ্যাকেশন মোড</p>
              <p className={cn('text-xs', enabled ? 'text-amber-600 font-semibold' : 'text-gray-400')}>
                {enabled ? 'সক্রিয় — গ্রাহকরা নোটিশ দেখতে পাচ্ছেন' : 'নিষ্ক্রিয়'}
              </p>
            </div>
          </div>
          <button onClick={() => setEnabled(!enabled)}
            className={cn('relative rounded-full transition-colors duration-200 focus:outline-none', enabled ? 'bg-amber-500' : 'bg-gray-200')}
            style={{ width: 52, height: 30 }}>
            <span className={cn('absolute bg-white rounded-full shadow transition-all duration-200')}
              style={{ width: 22, height: 22, top: 4, left: enabled ? 26 : 4 }} />
          </button>
        </div>

        {enabled && (
          <div className="bg-amber-100/50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              ভ্যাকেশন মোড চালু থাকলে আপনার শপ পেজে একটি ব্যানার দেখানো হবে এবং
              {pauseNewOrders ? ' নতুন অর্ডার গ্রহণ সাময়িক বন্ধ থাকবে।' : ' নতুন অর্ডার গ্রহণ চলতে থাকবে।'}
            </p>
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> ছুটির সময়কাল
        </h2>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-primary/30 hover:text-primary transition-colors bg-gray-50">
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">শুরুর তারিখ</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ফেরার তারিখ</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      {/* Auto-reply message */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> অটো-রিপ্লাই বার্তা
        </h2>
        <p className="text-xs text-gray-400">গ্রাহকরা অর্ডার দেওয়ার চেষ্টা করলে বা মেসেজ পাঠালে এই বার্তাটি দেখানো হবে</p>
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
      </div>

      {/* Order settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" /> অর্ডার সেটিংস
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">নতুন অর্ডার গ্রহণ বন্ধ করুন</p>
            <p className="text-xs text-gray-400 mt-0.5">ছুটির সময় নতুন অর্ডার নেওয়া বন্ধ থাকবে</p>
          </div>
          <button onClick={() => setPauseNewOrders(!pauseNewOrders)}
            className={cn('relative rounded-full transition-colors duration-200 focus:outline-none', pauseNewOrders ? 'bg-primary' : 'bg-gray-200')}
            style={{ width: 44, height: 26 }}>
            <span className={cn('absolute bg-white rounded-full shadow transition-all duration-200')}
              style={{ width: 18, height: 18, top: 4, left: pauseNewOrders ? 22 : 4 }} />
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save}
          className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90')}>
          {saved ? <><CheckCircle className="w-4 h-4" /> সেভ হয়েছে</> : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>
    </div>
  );
}
