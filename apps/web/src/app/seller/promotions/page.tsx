'use client';

import { useState } from 'react';
import { Zap, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type PromoStatus = 'active' | 'scheduled' | 'ended';

const PROMOS: { id: string; name: string; type: string; discount: string; products: number; starts: string; ends: string; status: PromoStatus; enabled: boolean }[] = [
  { id: 'P001', name: 'ঈদ স্পেশাল সেল',      type: 'percentage', discount: '20%',  products: 12, starts: '১০ জুন', ends: '২০ জুন', status: 'active',    enabled: true  },
  { id: 'P002', name: 'বই মেলা অফার',         type: 'flat',       discount: '৳150', products: 8,  starts: '২৫ জুন', ends: '৫ জুলা', status: 'scheduled', enabled: true  },
  { id: 'P003', name: 'গ্রীষ্মকালীন ডিসকাউন্ট', type: 'percentage', discount: '15%',  products: 20, starts: '১ মে',   ends: '৩১ মে', status: 'ended',     enabled: false },
];

const STATUS_META: Record<PromoStatus, { label: string; color: string }> = {
  active:    { label: 'সক্রিয়',    color: 'text-green-600 bg-green-50 border-green-200' },
  scheduled: { label: 'নির্ধারিত', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ended:     { label: 'শেষ',       color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState(PROMOS);
  const [showNew, setShowNew] = useState(false);

  const toggleEnabled = (id: string) =>
    setPromos(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">প্রমোশন</h1>
          <p className="text-sm text-gray-500 mt-0.5">বিক্রয় বাড়াতে অফার ও ডিসকাউন্ট তৈরি করুন</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> নতুন প্রমো
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'মোট প্রমো',   value: promos.length },
          { label: 'সক্রিয়',     value: promos.filter(p => p.status === 'active').length },
          { label: 'নির্ধারিত',  value: promos.filter(p => p.status === 'scheduled').length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Promotions list */}
      <div className="space-y-3">
        {promos.map(p => {
          const meta = STATUS_META[p.status];
          return (
            <div key={p.id} className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-opacity', !p.enabled && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.color)}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleEnabled(p.id)}>
                    {p.enabled
                      ? <ToggleRight className="w-7 h-7 text-primary" />
                      : <ToggleLeft className="w-7 h-7 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3 mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">ছাড়</p>
                  <p className="text-lg font-black text-primary">{p.discount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">পণ্য সংখ্যা</p>
                  <p className="text-lg font-black text-gray-900">{p.products}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">ধরন</p>
                  <p className="text-xs font-bold text-gray-700">{p.type === 'percentage' ? 'শতাংশ' : 'ফ্ল্যাট'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{p.starts} → {p.ends}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New promo form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">নতুন প্রমোশন তৈরি করুন</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">প্রমো নাম</label>
              <input placeholder="যেমন: ঈদ স্পেশাল সেল" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ছাড়ের ধরন</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>শতাংশ (%)</option>
                <option>ফ্ল্যাট পরিমাণ (৳)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ছাড়ের পরিমাণ</label>
              <input type="number" placeholder="20" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">শুরুর তারিখ</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">শেষের তারিখ</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            প্রমোশন তৈরি করুন
          </button>
        </div>
      )}
    </div>
  );
}
