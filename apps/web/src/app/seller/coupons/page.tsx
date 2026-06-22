'use client';

import { useState } from 'react';
import { Tag, Plus, Copy, Check, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type CouponStatus = 'active' | 'expired' | 'draft';

const COUPONS: { id: string; code: string; type: 'percent' | 'flat'; value: number; minOrder: number; used: number; limit: number; expires: string; status: CouponStatus }[] = [
  { id: 'C1', code: 'EID20',     type: 'percent', value: 20,  minOrder: 500,  used: 34, limit: 100, expires: '২০ জুন',  status: 'active'  },
  { id: 'C2', code: 'NEWBOOK150',type: 'flat',    value: 150, minOrder: 800,  used: 12, limit: 50,  expires: '৩০ জুন',  status: 'active'  },
  { id: 'C3', code: 'SUMMER15',  type: 'percent', value: 15,  minOrder: 400,  used: 89, limit: 100, expires: '৩১ মে',   status: 'expired' },
  { id: 'C4', code: 'WELCOME10', type: 'percent', value: 10,  minOrder: 300,  used: 0,  limit: 200, expires: '৩১ ডিস', status: 'draft'   },
];

const STATUS_META: Record<CouponStatus, { label: string; color: string }> = {
  active:  { label: 'সক্রিয়',  color: 'text-green-600 bg-green-50 border-green-200' },
  expired: { label: 'মেয়াদ শেষ', color: 'text-gray-500 bg-gray-50 border-gray-200' },
  draft:   { label: 'ড্রাফট',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
};

export default function SellerCouponsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">কুপন কোড</h1>
          <p className="text-sm text-gray-500 mt-0.5">ডিসকাউন্ট কুপন তৈরি ও পরিচালনা করুন</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> নতুন কুপন
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'মোট কুপন',  value: COUPONS.length },
          { label: 'সক্রিয়',   value: COUPONS.filter(c => c.status === 'active').length },
          { label: 'মোট ব্যবহার', value: COUPONS.reduce((s, c) => s + c.used, 0) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Coupons grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {COUPONS.map(c => {
          const meta = STATUS_META[c.status];
          const useRate = c.limit > 0 ? (c.used / c.limit) * 100 : 0;
          return (
            <div key={c.id} className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-opacity', c.status !== 'active' && 'opacity-70')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-sm font-black text-gray-900">{c.code}</span>
                      <button onClick={() => copy(c.code)} className="text-gray-400 hover:text-primary transition-colors">
                        {copied === c.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border', meta.color)}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-lg font-black text-primary">{c.type === 'percent' ? `${c.value}%` : `৳${c.value}`}</p>
                  <p className="text-[10px] text-gray-400">ছাড়</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-sm font-black text-gray-900">৳{c.minOrder}</p>
                  <p className="text-[10px] text-gray-400">ন্যূনতম</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-sm font-black text-gray-900">{c.expires}</p>
                  <p className="text-[10px] text-gray-400">মেয়াদ</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>ব্যবহার: {c.used}/{c.limit}</span>
                  <span>{useRate.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', useRate > 80 ? 'bg-red-400' : 'bg-primary')} style={{ width: `${useRate}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New coupon form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">নতুন কুপন তৈরি</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">কুপন কোড</label>
              <input placeholder="EID20" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ছাড়ের ধরন</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>শতাংশ (%)</option>
                <option>ফ্ল্যাট পরিমাণ (৳)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ছাড়ের মান</label>
              <input type="number" placeholder="20" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ন্যূনতম অর্ডার (৳)</label>
              <input type="number" placeholder="500" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">সর্বোচ্চ ব্যবহার</label>
              <input type="number" placeholder="100" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">মেয়াদ শেষ</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            কুপন তৈরি করুন
          </button>
        </div>
      )}
    </div>
  );
}
