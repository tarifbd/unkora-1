'use client';

import { useState } from 'react';
import { RotateCcw, Package, ChevronRight, Plus, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReturnStatus = 'requested' | 'approved' | 'picked' | 'completed' | 'rejected';

const RETURNS: { id: string; orderId: string; item: string; reason: string; amount: number; date: string; status: ReturnStatus }[] = [
  { id: 'RET-112', orderId: 'ORD-4421', item: 'Python Programming — 2nd Ed.', reason: 'ভুল পণ্য পেয়েছি',          amount: 1250, date: '০৮ জুন, ২০২৬', status: 'completed' },
  { id: 'RET-098', orderId: 'ORD-4200', item: 'বাংলাদেশের ইতিহাস (হার্ডকভার)',  reason: 'পণ্য ক্ষতিগ্রস্ত',        amount: 890,  date: '২৫ মে, ২০২৬', status: 'approved' },
  { id: 'RET-087', orderId: 'ORD-4100', item: 'English Grammar in Use',          reason: 'প্রত্যাশার সাথে মিলেনি',  amount: 650,  date: '১৮ মে, ২০২৬', status: 'rejected' },
];

const STATUS_META: Record<ReturnStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  requested: { label: 'অনুরোধ করা হয়েছে', icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  approved:  { label: 'অনুমোদিত',           icon: CheckCircle,   color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  picked:    { label: 'পিকআপ হয়েছে',        icon: Truck,         color: 'text-purple-600',bg: 'bg-purple-50 border-purple-200' },
  completed: { label: 'সম্পন্ন',             icon: CheckCircle,   color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  rejected:  { label: 'প্রত্যাখ্যাত',         icon: XCircle,       color: 'text-red-500',   bg: 'bg-red-50 border-red-200' },
};

const STEPS: ReturnStatus[] = ['requested', 'approved', 'picked', 'completed'];

export default function ReturnsPage() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">রিটার্ন ও রিফান্ড</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার রিটার্ন অনুরোধ ট্র্যাক করুন</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> নতুন রিটার্ন
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'মোট রিটার্ন', value: '3', color: 'text-gray-900' },
          { label: 'সম্পন্ন',     value: '1', color: 'text-green-600' },
          { label: 'মুলতবি',      value: '1', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Returns list */}
      <div className="space-y-3">
        {RETURNS.map(ret => {
          const meta = STATUS_META[ret.status];
          const Icon = meta.icon;
          const stepIdx = STEPS.indexOf(ret.status);
          return (
            <div key={ret.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ret.id}</p>
                      <p className="text-[11px] text-gray-400">অর্ডার: {ret.orderId} · {ret.date}</p>
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-sm font-semibold text-gray-900">{ret.item}</p>
                  <p className="text-xs text-gray-500 mt-0.5">কারণ: {ret.reason}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-primary">৳{ret.amount.toLocaleString()} রিফান্ড</p>
                  {ret.status !== 'rejected' && (
                    <div className="flex items-center gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                          <div className={cn('w-2 h-2 rounded-full', i <= stepIdx ? 'bg-primary' : 'bg-gray-200')} />
                          {i < STEPS.length - 1 && <div className={cn('w-4 h-0.5', i < stepIdx ? 'bg-primary' : 'bg-gray-200')} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New return modal */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4" /> নতুন রিটার্ন অনুরোধ</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">অর্ডার নম্বর</label>
              <input placeholder="ORD-XXXX" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">রিটার্নের কারণ</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>ভুল পণ্য পেয়েছি</option>
                <option>পণ্য ক্ষতিগ্রস্ত</option>
                <option>প্রত্যাশার সাথে মিলেনি</option>
                <option>ডুপ্লিকেট অর্ডার</option>
                <option>অন্যান্য</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">বিস্তারিত বিবরণ</label>
              <textarea rows={3} placeholder="সমস্যার বিস্তারিত বলুন..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              রিটার্ন অনুরোধ পাঠান
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
