'use client';

import { useState } from 'react';
import { ArrowLeftRight, Package, CheckCircle, XCircle, Clock, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExchangeStatus = 'requested' | 'approved' | 'item_received' | 'processing' | 'dispatched' | 'completed' | 'rejected';

const EXCHANGES: {
  id: string; orderId: string; customer: string; date: string; status: ExchangeStatus;
  original: { name: string; variant: string; price: number };
  requested: { name: string; variant: string; price: number };
  reason: string; diff: number;
}[] = [
  {
    id: 'EXC-201', orderId: 'ORD-5400', customer: 'রাফিউল ইসলাম', date: '১১ জুন', status: 'requested',
    original:  { name: 'Python Programming — 2nd Ed.', variant: 'পেপারব্যাক',  price: 1250 },
    requested: { name: 'Python Programming — 3rd Ed.', variant: 'হার্ডকভার',   price: 1600 },
    reason: 'নতুন সংস্করণ চাই', diff: 350,
  },
  {
    id: 'EXC-198', orderId: 'ORD-5350', customer: 'নাসরিন আক্তার', date: '৯ জুন', status: 'item_received',
    original:  { name: 'English Grammar in Use', variant: 'L — নীল',    price: 650 },
    requested: { name: 'English Grammar in Use', variant: 'M — নীল',    price: 650 },
    reason: 'ভুল সাইজ এসেছে', diff: 0,
  },
  {
    id: 'EXC-195', orderId: 'ORD-5300', customer: 'করিম হোসেন', date: '৫ জুন', status: 'dispatched',
    original:  { name: 'বাংলাদেশের ইতিহাস', variant: 'সফট কভার', price: 890 },
    requested: { name: 'বাংলাদেশের ইতিহাস', variant: 'হার্ড কভার', price: 1100 },
    reason: 'আরও ভালো মান চাই', diff: 210,
  },
  {
    id: 'EXC-190', orderId: 'ORD-5200', customer: 'সাব্বির আহমেদ', date: '১ জুন', status: 'completed',
    original:  { name: 'Data Structures — Vol 1', variant: 'পেপারব্যাক', price: 2100 },
    requested: { name: 'Data Structures — Vol 2', variant: 'পেপারব্যাক', price: 2100 },
    reason: 'ভুল ভলিউম পেয়েছি', diff: 0,
  },
  {
    id: 'EXC-185', orderId: 'ORD-5100', customer: 'ফাতিমা খানম', date: '২৫ মে', status: 'rejected',
    original:  { name: 'রবীন্দ্র রচনাবলী', variant: 'মানক',     price: 1800 },
    requested: { name: 'রবীন্দ্র রচনাবলী', variant: 'ডিলাক্স',   price: 3500 },
    reason: 'ডিলাক্স সংস্করণ চাই', diff: 1700,
  },
];

const STATUS_META: Record<ExchangeStatus, { label: string; icon: React.ElementType; color: string; bg: string; step: number }> = {
  requested:    { label: 'অনুরোধ',        icon: Clock,          color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',  step: 0 },
  approved:     { label: 'অনুমোদিত',      icon: CheckCircle,    color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    step: 1 },
  item_received:{ label: 'পণ্য পেয়েছি',  icon: Package,        color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',step: 2 },
  processing:   { label: 'প্রক্রিয়াধীন', icon: ArrowLeftRight, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', step: 3 },
  dispatched:   { label: 'পাঠানো হয়েছে', icon: Package,        color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-200',    step: 4 },
  completed:    { label: 'সম্পন্ন',        icon: CheckCircle,    color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  step: 5 },
  rejected:     { label: 'প্রত্যাখ্যাত',  icon: XCircle,        color: 'text-red-500',    bg: 'bg-red-50 border-red-200',      step: -1 },
};

const STEPS: ExchangeStatus[] = ['requested', 'approved', 'item_received', 'processing', 'dispatched', 'completed'];

export default function ExchangesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ExchangeStatus | 'all'>('all');

  const filtered = EXCHANGES
    .filter(e => filter === 'all' || e.status === filter)
    .filter(e => !search || e.id.toLowerCase().includes(search.toLowerCase()) || e.customer.includes(search));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Returns & Exchange Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">পণ্য পরিবর্তনের অনুরোধ পরিচালনা করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট এক্সচেঞ্জ',  value: EXCHANGES.length },
          { label: 'প্রক্রিয়াধীন',    value: EXCHANGES.filter(e => !['completed','rejected'].includes(e.status)).length },
          { label: 'সম্পন্ন',          value: EXCHANGES.filter(e => e.status === 'completed').length },
          { label: 'মূল্য পার্থক্য',  value: `৳${EXCHANGES.reduce((s,e)=>s+e.diff,0).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="অর্ডার ID বা গ্রাহক খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {(['all', 'requested', 'approved', 'item_received', 'dispatched', 'completed', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                filter === f ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
              {f === 'all' ? 'সব' : STATUS_META[f as ExchangeStatus]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange cards */}
      <div className="space-y-3">
        {filtered.map(ex => {
          const meta = STATUS_META[ex.status];
          const Icon = meta.icon;
          const stepIdx = STEPS.indexOf(ex.status);
          return (
            <div key={ex.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{ex.id}</p>
                    <p className="text-[11px] text-muted-foreground">অর্ডার {ex.orderId} · {ex.customer} · {ex.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ex.diff > 0 && (
                    <span className="text-sm font-black text-primary">+৳{ex.diff} অতিরিক্ত</span>
                  )}
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                </div>
              </div>

              {/* Product comparison */}
              <div className="px-5 py-4 grid sm:grid-cols-[1fr_40px_1fr] gap-3 items-center">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-red-500 uppercase mb-1">মূল পণ্য (ফেরত)</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{ex.original.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.original.variant}</p>
                  <p className="text-sm font-black text-gray-900 mt-1">৳{ex.original.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase mb-1">নতুন পণ্য (পাঠাবো)</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{ex.requested.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.requested.variant}</p>
                  <p className="text-sm font-black text-gray-900 mt-1">৳{ex.requested.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Reason + progress + actions */}
              <div className="px-5 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                  কারণ: <span className="font-semibold text-foreground">{ex.reason}</span>
                </p>

                {ex.status !== 'rejected' && (
                  <div className="flex items-center gap-1.5">
                    {STEPS.map((s, i) => (
                      <div key={s} className="flex items-center gap-1.5 flex-1">
                        <div className={cn('w-full h-1.5 rounded-full transition-colors', i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
                      </div>
                    ))}
                  </div>
                )}

                {ex.status === 'requested' && (
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন দিন
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যান
                    </button>
                  </div>
                )}
                {ex.status === 'approved' && (
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-200 hover:bg-purple-100 transition-colors">
                    <Package className="w-3.5 h-3.5" /> পণ্য পেয়েছি চিহ্নিত করুন
                  </button>
                )}
                {ex.status === 'item_received' && (
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> নতুন পণ্য পাঠান
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
