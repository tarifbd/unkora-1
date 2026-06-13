'use client';

import { useState } from 'react';
import {
  ShoppingCart, Clock, Phone, MessageSquare, Mail,
  TrendingUp, DollarSign, Users, CheckCircle, XCircle,
  RefreshCw, Link2, Plus, Settings, Download, Search,
  Filter, Zap, Eye, ChevronRight, AlertTriangle,
  BarChart3, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
type AbandonStage  = 'CART' | 'ADDRESS' | 'PAYMENT';
type RecoveryStatus = 'PENDING' | 'SENT' | 'OPENED' | 'RECOVERED' | 'EXPIRED';
type FollowupChannel = 'SMS' | 'WHATSAPP' | 'PUSH';
type TabId = 'list' | 'rules' | 'analytics';

/* ─── Mock data ──────────────────────────────────────────────── */
const CHECKOUTS: {
  id: string; phone: string; customer: string; items: number; total: number;
  stage: AbandonStage; status: RecoveryStatus; lastSeen: string;
  utm?: string; recoveryLink?: string; followupSent: number;
}[] = [
  { id: 'AC001', phone: '017XX-XXX901', customer: 'রাফিউল ইসলাম',   items: 3, total: 3200, stage: 'PAYMENT', status: 'OPENED',    lastSeen: '৫ মিনিট আগে',   utm: 'sms_followup_1',    followupSent: 1 },
  { id: 'AC002', phone: '018XX-XXX234', customer: 'নাসরিন আক্তার',  items: 1, total: 890,  stage: 'ADDRESS', status: 'SENT',      lastSeen: '১৫ মিনিট আগে',  utm: 'whatsapp_followup', followupSent: 1 },
  { id: 'AC003', phone: '019XX-XXX567', customer: 'অজানা',           items: 5, total: 2100, stage: 'CART',    status: 'PENDING',   lastSeen: '৩০ মিনিট আগে',  followupSent: 0 },
  { id: 'AC004', phone: '016XX-XXX890', customer: 'সাব্বির আহমেদ',  items: 2, total: 1450, stage: 'PAYMENT', status: 'RECOVERED', lastSeen: '১ ঘন্টা আগে',   utm: 'sms_followup_2',    followupSent: 2 },
  { id: 'AC005', phone: '015XX-XXX123', customer: 'ফাতিমা খানম',    items: 4, total: 670,  stage: 'CART',    status: 'PENDING',   lastSeen: '২ ঘন্টা আগে',   followupSent: 0 },
  { id: 'AC006', phone: '014XX-XXX456', customer: 'মাহমুদ হাসান',   items: 7, total: 5200, stage: 'ADDRESS', status: 'EXPIRED',   lastSeen: '১ দিন আগে',     followupSent: 3 },
  { id: 'AC007', phone: '013XX-XXX789', customer: 'রিমা বেগম',      items: 2, total: 980,  stage: 'PAYMENT', status: 'SENT',      lastSeen: '৩ ঘন্টা আগে',   utm: 'push_followup',     followupSent: 1 },
];

const STAGE_META: Record<AbandonStage, { label: string; color: string; bg: string; step: number }> = {
  CART:    { label: 'কার্টে ছেড়েছে',     color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',   step: 1 },
  ADDRESS: { label: 'ঠিকানায় আটকে',     color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200', step: 2 },
  PAYMENT: { label: 'পেমেন্টে আটকে',    color: 'text-red-600',    bg: 'bg-red-50 border-red-200',     step: 3 },
};

const STATUS_META: Record<RecoveryStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'পাঠানো হয়নি', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  SENT:      { label: 'পাঠানো হয়েছে', color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  OPENED:    { label: 'খোলা হয়েছে',  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  RECOVERED: { label: 'রিকভার',       color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  EXPIRED:   { label: 'মেয়াদ শেষ',   color: 'text-gray-400',   bg: 'bg-gray-50 border-gray-200' },
};

const CHANNEL_META: Record<FollowupChannel, { label: string; icon: React.ElementType; color: string }> = {
  SMS:      { label: 'SMS',       icon: MessageSquare, color: 'text-blue-600' },
  WHATSAPP: { label: 'WhatsApp', icon: Phone,         color: 'text-green-600' },
  PUSH:     { label: 'পুশ নোটিফ', icon: Zap,          color: 'text-purple-600' },
};

/* ─── Recovery funnel ────────────────────────────────────────── */
const FUNNEL = [
  { label: 'অ্যাবান্ডন',   count: 247, pct: 100, color: 'bg-gray-200' },
  { label: 'ফলোআপ পাঠানো', count: 198, pct: 80,  color: 'bg-blue-300' },
  { label: 'লিংক ক্লিক',   count: 89,  pct: 36,  color: 'bg-purple-400' },
  { label: 'চেকআউট ফিরে',  count: 52,  pct: 21,  color: 'bg-amber-400' },
  { label: 'অর্ডার সম্পন্ন', count: 31, pct: 13,  color: 'bg-green-500' },
];

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted-foreground/30')}>
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

/* ─── Follow-up rules ────────────────────────────────────────── */
const INITIAL_RULES = [
  { id: 'r1', label: '১ম ফলোআপ',  channel: 'SMS' as FollowupChannel,      delay: '30 মিনিট পর', enabled: true,  template: 'আপনার কার্টে {items}টি পণ্য আছে। এখনই অর্ডার করুন: {link}' },
  { id: 'r2', label: '২য় ফলোআপ',  channel: 'WHATSAPP' as FollowupChannel, delay: '৩ ঘন্টা পর',  enabled: true,  template: 'আপনার অর্ডার এখনও পেন্ডিং! শেষ সুযোগ: {link}' },
  { id: 'r3', label: '৩য় ফলোআপ',  channel: 'SMS' as FollowupChannel,      delay: '২৪ ঘন্টা পর', enabled: false, template: 'আপনার পছন্দের পণ্য শেষ হয়ে যাচ্ছে। এখনই নিন: {link}' },
  { id: 'r4', label: 'পুশ নোটিফ',  channel: 'PUSH' as FollowupChannel,    delay: '১ ঘন্টা পর',  enabled: false, template: 'কার্ট ওয়েটিং! সম্পন্ন করুন।' },
];

/* ─── Main Page ──────────────────────────────────────────────── */
export default function IncompleteOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [stageFilter, setStageFilter] = useState<AbandonStage | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RecoveryStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [saved, setSaved] = useState(false);

  const filtered = CHECKOUTS.filter(c => {
    if (stageFilter !== 'ALL' && c.stage !== stageFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (search && !c.phone.includes(search) && !c.customer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount  = CHECKOUTS.filter(c => c.status === 'PENDING').length;
  const recoveredAmt  = CHECKOUTS.filter(c => c.status === 'RECOVERED').reduce((s, c) => s + c.total, 0);
  const totalAbandoned = CHECKOUTS.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-black flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" /> অসম্পূর্ণ অর্ডার
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">অ্যাবান্ডন চেকআউট রিকভারি ফানেল ও অটো ফলোআপ</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
              <Clock className="w-3.5 h-3.5" /> {pendingCount}টি ফলোআপ পেন্ডিং
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> এক্সপোর্ট
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট অ্যাবান্ডন',    value: CHECKOUTS.length,         sub: 'আজ',        icon: ShoppingCart, color: 'text-gray-700',   bg: 'bg-gray-50' },
          { label: 'মোট হারানো (৳)',     value: `৳${(totalAbandoned/1000).toFixed(1)}k`, sub: 'আজ', icon: DollarSign,   color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'রিকভার করা (৳)',     value: `৳${recoveredAmt.toLocaleString()}`,     sub: 'আজ', icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'রিকভারি রেট',        value: '13%',                    sub: 'ফানেল',     icon: Users,        color: 'text-primary',    bg: 'bg-primary/10' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Recovery funnel strip */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h2 className="text-xs font-bold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <BarChart3 className="w-3.5 h-3.5 text-primary" /> রিকভারি ফানেল
        </h2>
        <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
          {FUNNEL.map((f, i) => (
            <div key={f.label} className="flex-1 min-w-[60px]">
              <div className="flex items-end gap-0.5 mb-1.5">
                <div className={cn('w-full rounded-t-lg transition-all', f.color)}
                  style={{ height: `${Math.max(f.pct * 0.8, 8)}px` }} />
              </div>
              <p className="text-[11px] font-bold text-center">{f.count}</p>
              <p className="text-[10px] text-muted-foreground text-center leading-tight">{f.label}</p>
              {i < FUNNEL.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground mx-auto mt-1 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {([
          { id: 'list',      label: `চেকআউট লিস্ট (${CHECKOUTS.length})` },
          { id: 'rules',     label: 'অটো ফলোআপ' },
          { id: 'analytics', label: 'অ্যানালিটিক্স' },
        ] as { id: TabId; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('flex-1 py-2.5 rounded-lg text-xs font-bold transition-all',
              activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── List Tab ── */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ফোন বা নাম সার্চ..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value as typeof stageFilter)}
              className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold">
              <option value="ALL">সব স্টেজ</option>
              <option value="CART">কার্ট</option>
              <option value="ADDRESS">ঠিকানা</option>
              <option value="PAYMENT">পেমেন্ট</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold">
              <option value="ALL">সব স্ট্যাটাস</option>
              <option value="PENDING">পেন্ডিং</option>
              <option value="SENT">পাঠানো</option>
              <option value="OPENED">খোলা</option>
              <option value="RECOVERED">রিকভার</option>
              <option value="EXPIRED">মেয়াদ শেষ</option>
            </select>
          </div>

          {/* Cards (mobile-friendly) */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {['গ্রাহক', 'পণ্য', 'পরিমাণ', 'স্টেজ', 'শেষ দেখা', 'স্ট্যাটাস', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(c => {
                    const stm = STAGE_META[c.stage];
                    const stm2 = STATUS_META[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold">{c.customer}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{c.phone}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold">{c.items}টি</td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-black">৳{c.total.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', stm.bg, stm.color)}>
                            {stm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{c.lastSeen}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', stm2.bg, stm2.color)}>
                            {stm2.label}
                          </span>
                          {c.followupSent > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{c.followupSent}টি পাঠানো</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {c.status === 'PENDING' && (
                              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors">
                                <Zap className="w-3 h-3" /> ফলোআপ
                              </button>
                            )}
                            {c.recoveryLink && (
                              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="রিকভারি লিংক কপি">
                                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Settings className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-700">অটো ফলোআপ সিকোয়েন্স</p>
              <p className="text-xs text-blue-600 mt-0.5">
                অ্যাবান্ডন চেকআউট সনাক্ত হলে নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে মেসেজ পাঠাবে। লিংকে ক্লিক করলে কার্ট হুবহু পুনরুদ্ধার হবে।
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule, idx) => {
              const cm = CHANNEL_META[rule.channel];
              const CIcon = cm.icon;
              return (
                <div key={rule.id} className={cn('bg-card rounded-xl border p-4 transition-opacity', !rule.enabled && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-bold">{rule.label}</p>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted border')}>
                          <CIcon className={cn('w-3 h-3', cm.color)} /> {cm.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{rule.delay}</span>
                      </div>
                      {rule.enabled && (
                        <textarea
                          rows={2}
                          value={rule.template}
                          onChange={e => setRules(prev => prev.map((r, i) => i === idx ? { ...r, template: e.target.value } : r))}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-xs resize-none"
                        />
                      )}
                      {rule.enabled && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          ভেরিয়েবল: {'{items}'}, {'{total}'}, {'{link}'}, {'{customer_name}'}
                        </p>
                      )}
                    </div>
                    <Toggle
                      checked={rule.enabled}
                      onChange={v => setRules(prev => prev.map((r, i) => i === idx ? { ...r, enabled: v } : r))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recovery link info */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> রিকভারি লিংক কীভাবে কাজ করে
            </h3>
            <div className="flex items-start gap-2 flex-wrap text-xs text-muted-foreground">
              {[
                'অ্যাবান্ডন সনাক্ত → ইউনিক টোকেন তৈরি',
                'লিংক: /checkout/recover?token=xxxxx',
                'ক্লিক করলে কার্ট, ঠিকানা, স্টেজ পুনরুদ্ধার',
                'UTM ট্র্যাকিং সহ',
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {s}
                  {i < 3 && <ChevronRight className="w-3 h-3 flex-shrink-0 hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
              className={cn('flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all',
                saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
              {saved ? <><CheckCircle className="w-4 h-4" /> সেভ হয়েছে!</> : 'নিয়ম সেভ করুন'}
            </button>
          </div>
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* 7-day trend */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> ৭ দিনের ট্রেন্ড
            </h3>
            <div className="flex items-end justify-between gap-2 h-28">
              {[
                { day: 'সোম', abandoned: 38, recovered: 5 },
                { day: 'মঙ্গল', abandoned: 42, recovered: 7 },
                { day: 'বুধ', abandoned: 31, recovered: 4 },
                { day: 'বৃহ', abandoned: 55, recovered: 9 },
                { day: 'শুক্র', abandoned: 48, recovered: 8 },
                { day: 'শনি', abandoned: 62, recovered: 12 },
                { day: 'রবি', abandoned: 45, recovered: 10 },
              ].map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col-reverse gap-0.5 items-stretch" style={{ height: '88px' }}>
                    <div className="bg-gray-200 rounded-sm" style={{ height: `${(d.abandoned / 62) * 70}px` }} />
                    <div className="bg-green-500 rounded-sm" style={{ height: `${(d.recovered / 62) * 70}px` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-gray-200 rounded-sm" /><span className="text-[11px] text-muted-foreground">অ্যাবান্ডন</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-green-500 rounded-sm" /><span className="text-[11px] text-muted-foreground">রিকভার</span></div>
            </div>
          </div>

          {/* Channel performance */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-sm mb-4">চ্যানেল পারফরম্যান্স</h3>
            <div className="space-y-3">
              {[
                { channel: 'SMS',      sent: 198, opened: 89,  converted: 31, rate: '15.7%' },
                { channel: 'WhatsApp', sent: 143, opened: 98,  converted: 28, rate: '19.6%' },
                { channel: 'Push',     sent: 87,  opened: 34,  converted: 9,  rate: '10.3%' },
              ].map(c => (
                <div key={c.channel} className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold w-20">{c.channel}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'পাঠানো', val: c.sent },
                      { label: 'খোলা',   val: c.opened },
                      { label: 'কনভার্ট', val: c.converted },
                    ].map(s => (
                      <div key={s.label} className="bg-muted rounded-lg p-2">
                        <p className="text-sm font-black">{s.val}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-black text-green-600 w-12 text-right">{c.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
