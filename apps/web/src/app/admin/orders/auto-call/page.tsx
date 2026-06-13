'use client';

import { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, PhoneMissed, CheckCircle, XCircle, Settings, Play, Pause, RotateCcw, Clock, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CallStatus = 'pending' | 'calling' | 'confirmed' | 'rejected' | 'no_answer' | 'failed';

const CALL_LOG: {
  id: string; order: string; customer: string; phone: string;
  amount: number; status: CallStatus; attempt: number; time: string; duration?: string;
}[] = [
  { id: 'C001', order: 'ORD-5512', customer: 'রাফিউল ইসলাম',   phone: '017XX-XXX901', amount: 3200, status: 'confirmed',  attempt: 1, time: '২ মিনিট আগে',   duration: '0:18' },
  { id: 'C002', order: 'ORD-5511', customer: 'নাসরিন আক্তার',  phone: '018XX-XXX234', amount: 890,  status: 'no_answer',  attempt: 2, time: '৫ মিনিট আগে',   duration: undefined },
  { id: 'C003', order: 'ORD-5510', customer: 'করিম হোসেন',     phone: '019XX-XXX567', amount: 2100, status: 'rejected',   attempt: 1, time: '৮ মিনিট আগে',   duration: '0:12' },
  { id: 'C004', order: 'ORD-5509', customer: 'সাব্বির আহমেদ',  phone: '017XX-XXX890', amount: 1450, status: 'confirmed',  attempt: 1, time: '১২ মিনিট আগে',  duration: '0:22' },
  { id: 'C005', order: 'ORD-5508', customer: 'ফাতিমা খানম',    phone: '018XX-XXX123', amount: 670,  status: 'calling',    attempt: 1, time: '১৫ মিনিট আগে',  duration: undefined },
  { id: 'C006', order: 'ORD-5507', customer: 'মাহমুদ হাসান',   phone: '019XX-XXX456', amount: 5200, status: 'pending',    attempt: 0, time: '২০ মিনিট আগে',  duration: undefined },
  { id: 'C007', order: 'ORD-5506', customer: 'রিমা বেগম',      phone: '017XX-XXX789', amount: 980,  status: 'confirmed',  attempt: 2, time: '২৫ মিনিট আগে',  duration: '0:31' },
  { id: 'C008', order: 'ORD-5505', customer: 'তানভীর আহমেদ',   phone: '018XX-XXX012', amount: 3800, status: 'failed',     attempt: 3, time: '৩০ মিনিট আগে',  duration: undefined },
];

const STATUS_META: Record<CallStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:    { label: 'অপেক্ষমাণ',    icon: Clock,       color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  calling:    { label: 'কল চলছে...',   icon: PhoneCall,   color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  confirmed:  { label: 'নিশ্চিত',       icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  rejected:   { label: 'প্রত্যাখ্যাত', icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
  no_answer:  { label: 'উত্তর নেই',    icon: PhoneMissed, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  failed:     { label: 'ব্যর্থ',        icon: PhoneOff,    color: 'text-red-400',    bg: 'bg-red-50 border-red-100' },
};

const total     = CALL_LOG.length;
const confirmed = CALL_LOG.filter(c => c.status === 'confirmed').length;
const rejected  = CALL_LOG.filter(c => c.status === 'rejected').length;
const pending   = CALL_LOG.filter(c => c.status === 'pending' || c.status === 'calling').length;

export default function AutoCallPage() {
  const [enabled, setEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'log' | 'config'>('queue');
  const [maxRetries, setMaxRetries] = useState('3');
  const [delaySeconds, setDelaySeconds] = useState('30');
  const [callWindow, setCallWindow] = useState({ start: '09:00', end: '21:00' });

  const queueItems = CALL_LOG.filter(c => c.status === 'pending' || c.status === 'calling' || c.status === 'no_answer');
  const logItems   = CALL_LOG.filter(c => c.status === 'confirmed' || c.status === 'rejected' || c.status === 'failed');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Phone className="w-6 h-6 text-primary" /> Auto Call Confirmation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">অর্ডার আসার সাথে সাথে স্বয়ংক্রিয় কল করে নিশ্চিত করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold',
            enabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500')}>
            <span className={cn('w-2 h-2 rounded-full', enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
            {enabled ? 'সিস্টেম চালু' : 'সিস্টেম বন্ধ'}
          </div>
          <button onClick={() => setEnabled(!enabled)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              enabled
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-primary text-white hover:bg-primary/90')}>
            {enabled ? <><Pause className="w-4 h-4" /> বন্ধ করুন</> : <><Play className="w-4 h-4" /> চালু করুন</>}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট কল',        value: total,                         icon: Phone,       color: 'text-gray-900 bg-gray-50' },
          { label: 'নিশ্চিত',        value: `${confirmed} (${Math.round(confirmed/total*100)}%)`, icon: CheckCircle, color: 'text-green-700 bg-green-50' },
          { label: 'প্রত্যাখ্যাত',  value: `${rejected}`,                icon: XCircle,     color: 'text-red-600 bg-red-50' },
          { label: 'অপেক্ষমাণ',      value: pending,                       icon: Clock,       color: 'text-amber-700 bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.color.split(' ')[1])}>
                  <Icon className={cn('w-3.5 h-3.5', s.color.split(' ')[0])} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* IVR flow diagram */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> IVR কল ফ্লো
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { step: '১', label: 'নতুন অর্ডার', sub: 'ট্রিগার',           color: 'bg-primary/10 text-primary border-primary/20' },
            { step: '→', label: '',            sub: '',                   color: '' },
            { step: '২', label: 'কল শুরু',     sub: `${delaySeconds} সেকেন্ড পর`, color: 'bg-blue-50 text-blue-600 border-blue-200' },
            { step: '→', label: '',            sub: '',                   color: '' },
            { step: '৩', label: 'IVR বার্তা',  sub: 'অটো প্লে',          color: 'bg-purple-50 text-purple-600 border-purple-200' },
            { step: '→', label: '',            sub: '',                   color: '' },
            { step: '১', label: 'নিশ্চিত',     sub: 'বাটন প্রেস',         color: 'bg-green-50 text-green-700 border-green-200' },
            { step: '২', label: 'সাপোর্ট',    sub: 'এজেন্টে ট্রান্সফার', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          ].map((s, i) => s.label ? (
            <div key={i} className={cn('flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-semibold min-w-[80px]', s.color)}>
              <span className="font-black text-base">{s.step}</span>
              <span className="font-bold">{s.label}</span>
              <span className="text-[10px] opacity-70">{s.sub}</span>
            </div>
          ) : (
            <span key={i} className="text-gray-400 text-xl font-light hidden sm:block">→</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[
          { id: 'queue',  label: `কল কিউ (${queueItems.length})` },
          { id: 'log',    label: `কল লগ (${logItems.length})` },
          { id: 'config', label: 'সেটিংস' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-bold transition-all',
              activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Queue */}
      {activeTab === 'queue' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {queueItems.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p className="font-semibold">কিউ খালি — সব কল সম্পন্ন</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                  <th className="text-left px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">গ্রাহক</th>
                  <th className="text-right px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">পরিমাণ</th>
                  <th className="text-center px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">চেষ্টা</th>
                  <th className="text-center px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                  <th className="text-center px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queueItems.map(c => {
                  const meta = STATUS_META[c.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold">{c.order}</p>
                        <p className="text-[11px] text-muted-foreground">{c.time}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-semibold">{c.customer}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{c.phone}</p>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-black">৳{c.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-sm font-bold text-muted-foreground">{c.attempt}/{maxRetries}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                          <Icon className="w-2.5 h-2.5" />
                          {meta.label}
                          {c.status === 'calling' && <span className="animate-pulse">●</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="পুনরায় কল">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors" title="ম্যানুয়াল নিশ্চিত">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="বাতিল">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Log */}
      {activeTab === 'log' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                <th className="text-left px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">গ্রাহক</th>
                <th className="text-right px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">পরিমাণ</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">সময়কাল</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">ফলাফল</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logItems.map(c => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold">{c.order}</p>
                      <p className="text-[11px] text-muted-foreground">{c.time}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-semibold">{c.customer}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{c.phone}</p>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-black">৳{c.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="text-sm text-muted-foreground">{c.duration ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                        <Icon className="w-2.5 h-2.5" /> {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Config */}
      {activeTab === 'config' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> কল সেটিংস</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">অর্ডারের পর কল দেরি (সেকেন্ড)</label>
              <input type="number" value={delaySeconds} onChange={e => setDelaySeconds(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" min="10" max="300" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">সর্বোচ্চ চেষ্টা</label>
              <input type="number" value={maxRetries} onChange={e => setMaxRetries(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" min="1" max="5" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">পুনরায় চেষ্টার বিরতি (মিনিট)</label>
              <input type="number" defaultValue="15" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> কল উইন্ডো</h3>
            <p className="text-xs text-muted-foreground">এই সময়ের বাইরে কল করা হবে না</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">শুরু</label>
                <input type="time" value={callWindow.start} onChange={e => setCallWindow(w => ({ ...w, start: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">শেষ</label>
                <input type="time" value={callWindow.end} onChange={e => setCallWindow(w => ({ ...w, end: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">উইন্ডোর বাইরের অর্ডারগুলো পরদিন সকালে কল করা হবে।</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-4 sm:col-span-2">
            <h3 className="font-bold">IVR বার্তা</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">বাংলা বার্তা (TTS)</label>
              <textarea rows={3} defaultValue="আপনার UNKORA অর্ডার নিশ্চিত করতে ১ চাপুন। বাতিল করতে ২ চাপুন। সাপোর্টের জন্য ৩ চাপুন।"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex justify-end">
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                সেটিংস সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
