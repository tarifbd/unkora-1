'use client';

import { useState } from 'react';
import { ShoppingCart, TrendingUp, Mail, MessageCircle, Bell, Clock, ToggleLeft, ToggleRight, Plus, Search, Users, DollarSign, Zap, AlertCircle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AbandonStatus = 'abandoned' | 'recovering' | 'recovered' | 'lost';
type RuleChannel = 'whatsapp' | 'email' | 'sms' | 'push';
type RuleStatus = 'active' | 'inactive';

interface AbandonedCart {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  abandonedAt: string;
  status: AbandonStatus;
  attempts: number;
  lastAttemptAt?: string;
}

interface RecoveryRule {
  id: string;
  name: string;
  trigger: string;
  channel: RuleChannel;
  delay: string;
  status: RuleStatus;
  sent: number;
  recovered: number;
}

const CARTS: AbandonedCart[] = [
  {
    id: 'CART-441', customer: 'শাহিন মাহমুদ', phone: '01711-111222',
    items: [{ name: 'Python Programming', qty: 1, price: 1600 }, { name: 'Data Science Intro', qty: 1, price: 1800 }],
    total: 3400, abandonedAt: 'আজ সকাল ৯:৪৫', status: 'abandoned', attempts: 0,
  },
  {
    id: 'CART-440', customer: 'রিমা বেগম', phone: '01812-223344',
    items: [{ name: 'ক্লাস ৯-১০ গণিত', qty: 1, price: 250 }, { name: 'ক্লাস ৯-১০ বিজ্ঞান', qty: 1, price: 280 }, { name: 'বাংলা ব্যাকরণ', qty: 1, price: 180 }],
    total: 710, abandonedAt: 'আজ সকাল ৮:২০', status: 'recovering', attempts: 1, lastAttemptAt: 'আজ সকাল ৯:২০',
  },
  {
    id: 'CART-438', customer: 'করিম আহমেদ', phone: '01913-334455',
    items: [{ name: 'রবীন্দ্র রচনাবলী', qty: 1, price: 1800 }],
    total: 1800, abandonedAt: 'গতকাল বিকেল ৪টা', status: 'recovered', attempts: 2, lastAttemptAt: 'গতকাল সন্ধ্যা ৬টা',
  },
  {
    id: 'CART-435', customer: 'সুমনা খানম', phone: '01614-445566',
    items: [{ name: 'English Grammar in Use', qty: 2, price: 650 }, { name: 'Spoken English Guide', qty: 1, price: 490 }],
    total: 1790, abandonedAt: '২ দিন আগে', status: 'lost', attempts: 3, lastAttemptAt: 'গতকাল রাত ৮টা',
  },
  {
    id: 'CART-430', customer: 'তানভির হাসান', phone: '01515-556677',
    items: [{ name: 'Machine Learning Basics', qty: 1, price: 2200 }],
    total: 2200, abandonedAt: '৩ দিন আগে', status: 'recovering', attempts: 2, lastAttemptAt: '১ দিন আগে',
  },
];

const RULES: RecoveryRule[] = [
  { id: 'R-01', name: '১ ঘণ্টা পর WhatsApp রিমাইন্ডার', trigger: 'কার্ট পরিত্যাগের ১ ঘণ্টা পর', channel: 'whatsapp', delay: '১ ঘণ্টা', status: 'active', sent: 1240, recovered: 186 },
  { id: 'R-02', name: '৩ ঘণ্টা পর SMS নোটিফিকেশন', trigger: 'কার্ট পরিত্যাগের ৩ ঘণ্টা পর', channel: 'sms', delay: '৩ ঘণ্টা', status: 'active', sent: 890, recovered: 98 },
  { id: 'R-03', name: '২৪ ঘণ্টা পর ইমেইল অফার', trigger: 'কার্ট পরিত্যাগের ২৪ ঘণ্টা পর', channel: 'email', delay: '২৪ ঘণ্টা', status: 'active', sent: 560, recovered: 72 },
  { id: 'R-04', name: 'পুশ নোটিফিকেশন রিমাইন্ডার', trigger: 'কার্ট পরিত্যাগের ৩০ মিনিট পর', channel: 'push', delay: '৩০ মিনিট', status: 'inactive', sent: 320, recovered: 28 },
];

const CART_STATUS: Record<AbandonStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  abandoned: { label: 'পরিত্যক্ত',   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  recovering:{ label: 'রিকভারি চলছে', color: 'text-blue-700',  bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  recovered: { label: 'রিকভার হয়েছে', color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500'  },
  lost:      { label: 'হারিয়ে গেছে',  color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
};

const CHANNEL_META: Record<RuleChannel, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
  email:    { label: 'ইমেইল',    icon: Mail,          color: 'text-blue-600',   bg: 'bg-blue-50'   },
  sms:      { label: 'SMS',      icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  push:     { label: 'পুশ',      icon: Bell,          color: 'text-amber-600',  bg: 'bg-amber-50'  },
};

type Tab = 'carts' | 'rules' | 'stats';

export default function CartRecoveryPage() {
  const [tab, setTab] = useState<Tab>('carts');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AbandonStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ruleStatuses, setRuleStatuses] = useState<Record<string, RuleStatus>>(
    Object.fromEntries(RULES.map(r => [r.id, r.status]))
  );

  const filtered = CARTS
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search || c.customer.includes(search) || c.id.toLowerCase().includes(search.toLowerCase()));

  const totalLost    = CARTS.reduce((s, c) => s + c.total, 0);
  const recovered    = CARTS.filter(c => c.status === 'recovered').reduce((s, c) => s + c.total, 0);
  const abandoning   = CARTS.filter(c => c.status !== 'recovered').length;
  const recoveryRate = Math.round((CARTS.filter(c => c.status === 'recovered').length / CARTS.length) * 100);

  const toggleRule = (id: string) => {
    setRuleStatuses(prev => ({ ...prev, [id]: prev[id] === 'active' ? 'inactive' : 'active' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Cart Abandonment Recovery</h1>
          <p className="text-sm text-muted-foreground mt-0.5">পরিত্যক্ত কার্ট রিকভারি অটোমেশন পরিচালনা</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            {RULES.filter(r => ruleStatuses[r.id] === 'active').length} নিয়ম সক্রিয়
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'পরিত্যক্ত কার্ট', value: abandoning,                       sub: 'রিকভারি চলছে',   icon: ShoppingCart,  color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'রিকভারি হার',     value: `${recoveryRate}%`,               sub: 'এই সপ্তাহে',     icon: TrendingUp,    color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'রিকভার হওয়া মূল্য', value: `৳${recovered.toLocaleString()}`, sub: 'এই সপ্তাহে',   icon: DollarSign,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'মোট হারিয়ে যাওয়া', value: `৳${totalLost.toLocaleString()}`, sub: 'রিকভারি টার্গেট', icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-50'    },
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
        {(['carts', 'rules', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t === 'carts' ? 'পরিত্যক্ত কার্ট' : t === 'rules' ? 'অটোমেশন নিয়ম' : 'বিশ্লেষণ'}
          </button>
        ))}
      </div>

      {/* CARTS TAB */}
      {tab === 'carts' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="গ্রাহক নাম বা কার্ট ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'abandoned', 'recovering', 'recovered', 'lost'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                    filter === f ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
                  {f === 'all' ? 'সব' : CART_STATUS[f as AbandonStatus]?.label ?? f}
                </button>
              ))}
            </div>
          </div>

          {filtered.map(cart => {
            const meta = CART_STATUS[cart.status];
            const isExpanded = expandedId === cart.id;
            return (
              <div key={cart.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{cart.customer}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1', meta.color, meta.bg, meta.border)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {cart.id} · {cart.phone} · পরিত্যাগ: {cart.abandonedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-base font-black">৳{cart.total.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">কার্ট মূল্য</p>
                    </div>
                    <div>
                      <p className="text-base font-black">{cart.items.length}</p>
                      <p className="text-[10px] text-muted-foreground">পণ্য</p>
                    </div>
                    <div>
                      <p className="text-base font-black">{cart.attempts}</p>
                      <p className="text-[10px] text-muted-foreground">প্রচেষ্টা</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cart.status === 'abandoned' && (
                      <button className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> রিকভারি শুরু
                      </button>
                    )}
                    {cart.status === 'recovering' && (
                      <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                        <Bell className="w-3.5 h-3.5" /> পুনরায় পাঠান
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : cart.id)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-muted/20 px-5 py-4">
                    <p className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wide">কার্টের পণ্যসমূহ</p>
                    <div className="space-y-2">
                      {cart.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-card rounded-lg px-3 py-2 border">
                          <span className="font-semibold">{item.name} {item.qty > 1 && <span className="text-xs text-blue-600 font-bold">× {item.qty}</span>}</span>
                          <span className="font-bold">৳{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {cart.lastAttemptAt && (
                      <p className="text-[11px] text-muted-foreground mt-3">
                        শেষ যোগাযোগ: {cart.lastAttemptAt} · {cart.attempts} বার চেষ্টা করা হয়েছে
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RULES TAB */}
      {tab === 'rules' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> নতুন নিয়ম তৈরি
            </button>
          </div>
          {RULES.map(rule => {
            const channel = CHANNEL_META[rule.channel];
            const ChannelIcon = channel.icon;
            const isActive = ruleStatuses[rule.id] === 'active';
            const rRate = rule.sent > 0 ? Math.round((rule.recovered / rule.sent) * 100) : 0;
            return (
              <div key={rule.id} className={cn('rounded-xl border bg-card shadow-sm overflow-hidden transition-opacity', !isActive && 'opacity-60')}>
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', channel.bg)}>
                    <ChannelIcon className={cn('w-5 h-5', channel.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{rule.name}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', channel.color, channel.bg)}>
                        {channel.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ট্রিগার: {rule.trigger}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-base font-black">{rule.sent.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">পাঠানো</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-green-600">{rule.recovered}</p>
                      <p className="text-[10px] text-muted-foreground">রিকভার</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-primary">{rRate}%</p>
                      <p className="text-[10px] text-muted-foreground">সাফল্য</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => toggleRule(rule.id)} title="চালু/বন্ধ করুন">
                      {isActive
                        ? <ToggleRight className="w-8 h-8 text-green-500" />
                        : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Rule Flow Visual */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> অটোমেশন ফ্লো
            </h3>
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {[
                { label: 'কার্ট পরিত্যাগ', sub: 'ট্রিগার', color: 'bg-amber-100 border-amber-300 text-amber-700', dot: 'bg-amber-500' },
                { label: '৩০ মিনিট পর', sub: 'পুশ নোটিফিকেশন', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', dot: 'bg-yellow-400' },
                { label: '১ ঘণ্টা পর', sub: 'WhatsApp রিমাইন্ডার', color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-500' },
                { label: '৩ ঘণ্টা পর', sub: 'SMS পাঠানো', color: 'bg-purple-50 border-purple-200 text-purple-700', dot: 'bg-purple-500' },
                { label: '২৪ ঘণ্টা পর', sub: 'ইমেইল অফার', color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500' },
                { label: 'রিকভার/হারানো', sub: 'চূড়ান্ত ফলাফল', color: 'bg-muted border-border text-muted-foreground', dot: 'bg-muted-foreground' },
              ].map((step, i) => (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div className={cn('rounded-xl border-2 px-3 py-2.5 text-center min-w-[100px]', step.color)}>
                    <div className={cn('w-2 h-2 rounded-full mx-auto mb-1', step.dot)} />
                    <p className="text-[11px] font-bold">{step.label}</p>
                    <p className="text-[10px] opacity-80">{step.sub}</p>
                  </div>
                  {i < 5 && <div className="w-6 h-0.5 bg-muted flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATS TAB */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Channel performance */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4">চ্যানেল পারফরম্যান্স</h3>
              <div className="space-y-4">
                {RULES.map(rule => {
                  const channel = CHANNEL_META[rule.channel];
                  const ChannelIcon = channel.icon;
                  const rRate = rule.sent > 0 ? Math.round((rule.recovered / rule.sent) * 100) : 0;
                  return (
                    <div key={rule.id} className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', channel.bg)}>
                        <ChannelIcon className={cn('w-4 h-4', channel.color)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold">{channel.label}</span>
                          <span className="font-black text-primary">{rRate}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${rRate}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{rule.sent} পাঠানো · {rule.recovered} রিকভার</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly trend */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4">সাপ্তাহিক রিকভারি ট্রেন্ড</h3>
              <div className="flex items-end gap-2 h-28">
                {[
                  { d: 'সোম', abandoned: 12, recovered: 4 },
                  { d: 'মঙ্গল', abandoned: 18, recovered: 6 },
                  { d: 'বুধ', abandoned: 15, recovered: 7 },
                  { d: 'বৃহ', abandoned: 22, recovered: 9 },
                  { d: 'শুক্র', abandoned: 28, recovered: 12 },
                  { d: 'শনি', abandoned: 35, recovered: 15 },
                  { d: 'রবি', abandoned: 30, recovered: 11 },
                ].map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col justify-end gap-0.5 h-20">
                      <div className="w-full bg-green-400 rounded-t-sm" style={{ height: `${(d.recovered / 35) * 100}%` }} title={`রিকভার: ${d.recovered}`} />
                      <div className="w-full bg-muted rounded-t-sm" style={{ height: `${((d.abandoned - d.recovered) / 35) * 100}%` }} title={`হারানো: ${d.abandoned - d.recovered}`} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">{d.d}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-400" /><span className="text-[11px] text-muted-foreground">রিকভার</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted" /><span className="text-[11px] text-muted-foreground">হারানো</span></div>
              </div>
            </div>
          </div>

          {/* Summary row */}
          <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-blue-500/5 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold">এই মাসের সারসংক্ষেপ</h3>
                <p className="text-sm text-muted-foreground">কার্ট রিকভারি অটোমেশন সামগ্রিক ফলাফল</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-black text-amber-600">{CARTS.length}</p>
                  <p className="text-xs text-muted-foreground">পরিত্যক্ত কার্ট</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-green-600">{CARTS.filter(c => c.status === 'recovered').length}</p>
                  <p className="text-xs text-muted-foreground">রিকভার হয়েছে</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">৳{recovered.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">রিকভার মূল্য</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
