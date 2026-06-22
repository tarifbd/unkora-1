'use client';

import { useState } from 'react';
import { MessageCircle, Send, Users, CheckCheck, Clock, Plus, Search, BarChart2, Smartphone, AlertCircle, ChevronDown, ChevronUp, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
type TemplateCategory = 'order' | 'promo' | 'reminder' | 'custom';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  template: string;
  audience: string;
  total: number;
  delivered: number;
  read: number;
  clicked: number;
  scheduledAt: string;
  sentAt?: string;
}

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  body: string;
  approved: boolean;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'WA-C-011', name: 'ঈদ স্পেশাল অফার', status: 'sent', template: 'promo_eid_special',
    audience: 'সব গ্রাহক', total: 4820, delivered: 4691, read: 3210, clicked: 890,
    scheduledAt: '৫ জুন, সকাল ১০টা', sentAt: '৫ জুন, সকাল ১০:০২',
  },
  {
    id: 'WA-C-010', name: 'অর্ডার কনফার্মেশন রিমাইন্ডার', status: 'sending', template: 'order_reminder_v2',
    audience: 'পেন্ডিং অর্ডার', total: 234, delivered: 189, read: 120, clicked: 45,
    scheduledAt: '১২ জুন, বিকেল ৩টা',
  },
  {
    id: 'WA-C-009', name: 'নতুন বই প্রকাশনা', status: 'scheduled', template: 'new_arrivals_june',
    audience: 'উইশলিস্ট গ্রাহক', total: 1540, delivered: 0, read: 0, clicked: 0,
    scheduledAt: '১৫ জুন, সকাল ৯টা',
  },
  {
    id: 'WA-C-008', name: 'কার্ট পরিত্যাগ রিকভারি', status: 'sent', template: 'cart_abandon_v1',
    audience: 'কার্ট ছেড়ে যাওয়া', total: 680, delivered: 665, read: 498, clicked: 182,
    scheduledAt: '৩ জুন', sentAt: '৩ জুন, সকাল ১১টা',
  },
  {
    id: 'WA-C-007', name: 'রিভিউ রিকোয়েস্ট', status: 'draft', template: 'review_request_v1',
    audience: 'ডেলিভার্ড অর্ডার', total: 890, delivered: 0, read: 0, clicked: 0,
    scheduledAt: 'নির্ধারিত হয়নি',
  },
];

const TEMPLATES: Template[] = [
  { id: 'T-01', name: 'অর্ডার কনফার্মেশন', category: 'order', approved: true, body: 'আপনার অর্ডার {{order_id}} কনফার্ম হয়েছে! ডেলিভারি হবে {{delivery_date}} তারিখে। ট্র্যাক করুন: {{track_link}}' },
  { id: 'T-02', name: 'ঈদ অফার', category: 'promo', approved: true, body: '🎉 ঈদ মোবারক! {{shop_name}}-এ সকল বইয়ে {{discount}}% ছাড়। অফার শেষ হওয়ার আগেই অর্ডার করুন 👉 {{shop_link}}' },
  { id: 'T-03', name: 'কার্ট রিমাইন্ডার', category: 'reminder', approved: true, body: 'আপনার কার্টে {{item_count}}টি বই আছে। এখনই অর্ডার করুন এবং পান বিশেষ ছাড়! 👉 {{cart_link}}' },
  { id: 'T-04', name: 'নতুন বই বিজ্ঞপ্তি', category: 'promo', approved: false, body: '📚 নতুন এসেছে! "{{book_name}}" এখন পাওয়া যাচ্ছে। লেখক: {{author}}। মূল্য: ৳{{price}}। অর্ডার করুন: {{link}}' },
];

const STATUS_META: Record<CampaignStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  draft:     { label: 'ড্রাফট',       color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
  scheduled: { label: 'নির্ধারিত',    color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'   },
  sending:   { label: 'পাঠানো হচ্ছে', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500'  },
  sent:      { label: 'পাঠানো হয়েছে', color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'  },
  failed:    { label: 'ব্যর্থ',       color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'    },
};

const CAT_META: Record<TemplateCategory, { label: string; color: string; bg: string }> = {
  order:    { label: 'অর্ডার',     color: 'text-blue-700',   bg: 'bg-blue-100'   },
  promo:    { label: 'প্রমো',      color: 'text-purple-700', bg: 'bg-purple-100' },
  reminder: { label: 'রিমাইন্ডার', color: 'text-amber-700',  bg: 'bg-amber-100'  },
  custom:   { label: 'কাস্টম',     color: 'text-gray-700',   bg: 'bg-gray-100'   },
};

type Tab = 'campaigns' | 'templates' | 'analytics';

function MetricBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-bold">{value.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function WhatsAppMarketingPage() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = CAMPAIGNS
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));

  const totalSent    = CAMPAIGNS.reduce((s, c) => s + c.total, 0);
  const totalDelivered = CAMPAIGNS.reduce((s, c) => s + c.delivered, 0);
  const totalRead    = CAMPAIGNS.reduce((s, c) => s + c.read, 0);
  const totalClicked = CAMPAIGNS.reduce((s, c) => s + c.clicked, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">WhatsApp Marketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ক্যাম্পেইন পরিচালনা ও টেমপ্লেট ম্যানেজমেন্ট</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            WhatsApp API সংযুক্ত
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> নতুন ক্যাম্পেইন
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট বার্তা',   value: totalSent.toLocaleString(),      sub: 'সব ক্যাম্পেইন',  icon: Send,        color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'ডেলিভারি হার', value: `${Math.round((totalDelivered/totalSent)*100)}%`, sub: `${totalDelivered.toLocaleString()} বার্তা`, icon: CheckCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'পড়ার হার',    value: `${Math.round((totalRead/totalDelivered)*100)}%`,  sub: `${totalRead.toLocaleString()} পড়েছেন`, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'ক্লিক হার',   value: `${Math.round((totalClicked/totalDelivered)*100)}%`, sub: `${totalClicked.toLocaleString()} ক্লিক`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['campaigns', 'templates', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t === 'campaigns' ? 'ক্যাম্পেইন' : t === 'templates' ? 'টেমপ্লেট' : 'বিশ্লেষণ'}
          </button>
        ))}
      </div>

      {/* CAMPAIGNS TAB */}
      {tab === 'campaigns' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ক্যাম্পেইন নাম বা ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'draft', 'scheduled', 'sending', 'sent', 'failed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                    filter === f ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
                  {f === 'all' ? 'সব' : STATUS_META[f as CampaignStatus]?.label ?? f}
                </button>
              ))}
            </div>
          </div>

          {filtered.map(c => {
            const meta = STATUS_META[c.status];
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{c.name}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1', meta.color, meta.bg, meta.border)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot, c.status === 'sending' ? 'animate-pulse' : '')} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {c.id} · টার্গেট: {c.audience} · {c.scheduledAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-base font-black">{c.total.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">মোট</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-green-600">{c.status === 'sent' || c.status === 'sending' ? `${Math.round((c.delivered/c.total)*100)}%` : '—'}</p>
                      <p className="text-[10px] text-muted-foreground">ডেলিভারি</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-blue-600">{c.status === 'sent' ? `${Math.round((c.read/c.delivered)*100)}%` : '—'}</p>
                      <p className="text-[10px] text-muted-foreground">পড়েছেন</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isExpanded && c.status === 'sent' && (
                  <div className="border-t bg-muted/20 px-5 py-4 space-y-2.5">
                    <MetricBar label="ডেলিভারি" value={c.delivered} total={c.total} color="bg-green-500" />
                    <MetricBar label="পড়েছেন" value={c.read} total={c.delivered} color="bg-blue-500" />
                    <MetricBar label="ক্লিক করেছেন" value={c.clicked} total={c.read} color="bg-purple-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {TEMPLATES.map(t => {
            const catMeta = CAT_META[t.category];
            return (
              <div key={t.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{t.name}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', catMeta.color, catMeta.bg)}>
                      {catMeta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.approved
                      ? <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold"><CheckCheck className="w-3 h-3" /> অনুমোদিত</span>
                      : <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold"><Clock className="w-3 h-3" /> পর্যালোচনাধীন</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Smartphone className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] font-bold text-green-600">WhatsApp Preview</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{t.body}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-2 border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
                      সম্পাদনা
                    </button>
                    <button className="flex-1 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                      ক্যাম্পেইনে ব্যবহার করুন
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Delivery Funnel */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4">সামগ্রিক ফানেল বিশ্লেষণ</h3>
              <div className="space-y-3">
                {[
                  { label: 'মোট পাঠানো',  value: totalSent,       pct: 100, color: 'bg-blue-500' },
                  { label: 'ডেলিভার হয়েছে', value: totalDelivered, pct: Math.round((totalDelivered/totalSent)*100), color: 'bg-green-500' },
                  { label: 'পড়েছেন',      value: totalRead,       pct: Math.round((totalRead/totalSent)*100), color: 'bg-purple-500' },
                  { label: 'ক্লিক করেছেন', value: totalClicked,   pct: Math.round((totalClicked/totalSent)*100), color: 'bg-amber-500' },
                ].map(f => (
                  <div key={f.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-bold">{f.value.toLocaleString()} ({f.pct}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', f.color)} style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Performance Table */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4">ক্যাম্পেইন কার্যকারিতা</h3>
              <div className="space-y-3">
                {CAMPAIGNS.filter(c => c.status === 'sent').map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.audience}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-purple-600">{Math.round((c.read/c.delivered)*100)}%</p>
                      <p className="text-[10px] text-muted-foreground">পড়ার হার</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-600">{Math.round((c.clicked/c.delivered)*100)}%</p>
                      <p className="text-[10px] text-muted-foreground">ক্লিক</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best time to send */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">বার্তা পাঠানোর সেরা সময়</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['৬টা', '৭টা', '৮টা', '৯টা', '১০টা', '১১টা', '১২টা', '২টা', '৩টা', '৪টা', '৫টা', '৬টা', '৭টা', '৮টা', '৯টা', '১০টা'].map((h, i) => {
                const engagement = [20, 35, 60, 82, 95, 88, 75, 55, 68, 78, 85, 90, 72, 60, 45, 25][i];
                return (
                  <div key={h} className="text-center space-y-1">
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-full rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer"
                        style={{ height: `${engagement}%` }} title={`${engagement}% এনগেজমেন্ট`} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">{h}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">সকাল ১০টা থেকে দুপুর ১২টার মধ্যে সর্বোচ্চ এনগেজমেন্ট</p>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">নতুন WhatsApp ক্যাম্পেইন</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ক্যাম্পেইনের নাম</label>
                <input placeholder="যেমন: ঈদ স্পেশাল অফার" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">টেমপ্লেট নির্বাচন করুন</label>
                <select className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {TEMPLATES.filter(t => t.approved).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">টার্গেট অডিয়েন্স</label>
                <select className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>সব গ্রাহক</option>
                  <option>পেন্ডিং অর্ডার</option>
                  <option>কার্ট ছেড়ে যাওয়া</option>
                  <option>উইশলিস্ট গ্রাহক</option>
                  <option>নতুন গ্রাহক</option>
                  <option>নিয়মিত গ্রাহক</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">পাঠানোর তারিখ</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">পাঠানোর সময়</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">বার্তা পাঠানোর আগে নিশ্চিত করুন যে প্রাপকরা বার্তা পেতে সম্মত হয়েছেন (GDPR/BTRC অনুযায়ী)।</p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted transition-colors">বাতিল</button>
              <button className="flex-1 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">ড্রাফট সংরক্ষণ</button>
              <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">শিডিউল করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
