'use client';

import { useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

const RETURNS: { id: string; orderId: string; buyer: string; item: string; reason: string; amount: number; date: string; status: ReturnStatus }[] = [
  { id: 'RET-445', orderId: 'ORD-8821', buyer: 'রাফিউল ইসলাম',  item: 'Python Programming',      reason: 'ভুল পণ্য',         amount: 1250, date: '১১ জুন', status: 'pending'   },
  { id: 'RET-432', orderId: 'ORD-8700', buyer: 'নাসরিন আক্তার', item: 'English Grammar in Use',   reason: 'ক্ষতিগ্রস্ত',     amount: 650,  date: '৮ জুন',  status: 'approved'  },
  { id: 'RET-418', orderId: 'ORD-8620', buyer: 'করিম হোসেন',    item: 'বাংলাদেশের ইতিহাস',       reason: 'প্রত্যাশামত নয়',  amount: 890,  date: '৩ জুন',  status: 'rejected'  },
  { id: 'RET-401', orderId: 'ORD-8500', buyer: 'সাব্বির আহমেদ', item: 'Data Structures',          reason: 'ডুপ্লিকেট অর্ডার', amount: 2100, date: '২৮ মে',  status: 'completed' },
];

const STATUS_META: Record<ReturnStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:   { label: 'পর্যালোচনা',   icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  approved:  { label: 'অনুমোদিত',     icon: CheckCircle,  color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  rejected:  { label: 'প্রত্যাখ্যাত', icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50 border-red-200' },
  completed: { label: 'সম্পন্ন',      icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
};

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState(RETURNS);
  const [activeFilter, setActiveFilter] = useState<ReturnStatus | 'all'>('all');

  const updateStatus = (id: string, status: ReturnStatus) =>
    setReturns(r => r.map(x => x.id === id ? { ...x, status } : x));

  const filtered = returns.filter(r => activeFilter === 'all' || r.status === activeFilter);

  const counts = {
    all:       returns.length,
    pending:   returns.filter(r => r.status === 'pending').length,
    approved:  returns.filter(r => r.status === 'approved').length,
    completed: returns.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">রিটার্ন ও বিরোধ</h1>
        <p className="text-sm text-gray-500 mt-0.5">গ্রাহকের রিটার্ন অনুরোধ পরিচালনা করুন</p>
      </div>

      {/* Alert */}
      {counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            {counts.pending}টি রিটার্ন অনুরোধ পর্যালোচনার অপেক্ষায় আছে
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] pb-1">
        {([
          { key: 'all',      label: `সব (${counts.all})` },
          { key: 'pending',  label: `পর্যালোচনা (${counts.pending})` },
          { key: 'approved', label: `অনুমোদিত (${counts.approved})` },
          { key: 'completed',label: `সম্পন্ন (${counts.completed})` },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              activeFilter === f.key ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/30')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Returns list */}
      <div className="space-y-3">
        {filtered.map(ret => {
          const meta = STATUS_META[ret.status];
          const Icon = meta.icon;
          return (
            <div key={ret.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900">{ret.id}</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                      <Icon className="w-2.5 h-2.5" /> {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">অর্ডার: {ret.orderId} · {ret.date}</p>
                </div>
                <p className="text-sm font-black text-primary flex-shrink-0">৳{ret.amount.toLocaleString()}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-3 grid sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">গ্রাহক</p>
                  <p className="text-sm font-semibold text-gray-900">{ret.buyer}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">পণ্য</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{ret.item}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">কারণ</p>
                  <p className="text-sm font-semibold text-gray-900">{ret.reason}</p>
                </div>
              </div>

              {ret.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(ret.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200">
                    <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন
                  </button>
                  <button onClick={() => updateStatus(ret.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors border border-red-200">
                    <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যান
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-200">
                    <MessageSquare className="w-3.5 h-3.5" /> বার্তা
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
