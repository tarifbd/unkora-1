'use client';

import { useState, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, ShieldX, Phone, Globe, MapPin, CheckSquare, Square,
  CheckCircle2, XCircle, Ban, Zap, AlertTriangle, Wifi, Smartphone, TrendingUp,
  Settings2, ChevronDown, ChevronUp, Fingerprint, RefreshCw, PhoneCall, PhoneOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ============================================================================
 * Fraud Detection Console — IP tracking + phone verification engine
 * Solves alert-overload via auto-decisioning: only the ambiguous middle tier
 * lands in the manual review queue; safe = auto-confirm, high-risk = auto-block.
 * ========================================================================== */

type RiskTier = 'safe' | 'review' | 'high';

const TIER_META: Record<RiskTier, { label: string; color: string; bg: string; border: string; ring: string }> = {
  safe:   { label: 'নিরাপদ',       color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  ring: 'ring-green-500' },
  review: { label: 'রিভিউ দরকার',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-500' },
  high:   { label: 'উচ্চ ঝুঁকি',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    ring: 'ring-red-500' },
};

type PhoneHistory = 'verified' | 'new' | 'reported';
type IpFlag = 'known' | 'new' | 'repeat' | 'vpn';

interface FraudOrder {
  id: string;
  customer: string;
  phone: string;
  total: number;
  channel: string;
  placedAt: string;
  riskScore: number;            // 0-100
  // phone signals
  phoneHistory: PhoneHistory;
  otpVerified: boolean;
  pastFakeReports: number;
  // ip / device signals
  ipFlag: IpFlag;
  ipLocation: string;
  ordersFromIp: number;         // same IP order count in 24h
  deviceRepeat: number;         // same device fingerprint orders
  // address / cod
  addressMatch: boolean;
  codFailures: number;          // prior COD return count for this customer
}

function tierOf(score: number): RiskTier {
  if (score <= 30) return 'safe';
  if (score <= 70) return 'review';
  return 'high';
}

const ORDERS: FraudOrder[] = [
  {
    id: 'ORD-9012', customer: 'সাইফুল ইসলাম', phone: '01711-220034', total: 1850, channel: 'ওয়েবসাইট', placedAt: 'আজ ১১:২০',
    riskScore: 12, phoneHistory: 'verified', otpVerified: true, pastFakeReports: 0,
    ipFlag: 'known', ipLocation: 'ঢাকা, BD', ordersFromIp: 1, deviceRepeat: 0, addressMatch: true, codFailures: 0,
  },
  {
    id: 'ORD-9011', customer: 'রুমানা পারভিন', phone: '01822-114455', total: 640, channel: 'Facebook', placedAt: 'আজ ১১:০৫',
    riskScore: 22, phoneHistory: 'verified', otpVerified: true, pastFakeReports: 0,
    ipFlag: 'known', ipLocation: 'চট্টগ্রাম, BD', ordersFromIp: 1, deviceRepeat: 0, addressMatch: true, codFailures: 0,
  },
  {
    id: 'ORD-9010', customer: 'আরিফ হোসেন', phone: '01933-667788', total: 3200, channel: 'WhatsApp', placedAt: 'আজ ১০:৪০',
    riskScore: 48, phoneHistory: 'new', otpVerified: false, pastFakeReports: 0,
    ipFlag: 'new', ipLocation: 'সিলেট, BD', ordersFromIp: 2, deviceRepeat: 1, addressMatch: true, codFailures: 1,
  },
  {
    id: 'ORD-9009', customer: 'নাম দেওয়া হয়নি', phone: '01644-009988', total: 5400, channel: 'Facebook', placedAt: 'আজ ১০:১৫',
    riskScore: 64, phoneHistory: 'new', otpVerified: false, pastFakeReports: 1,
    ipFlag: 'repeat', ipLocation: 'ঢাকা, BD', ordersFromIp: 4, deviceRepeat: 3, addressMatch: false, codFailures: 2,
  },
  {
    id: 'ORD-9008', customer: 'Test User', phone: '01555-000000', total: 8900, channel: 'ওয়েবসাইট', placedAt: 'আজ ৯:৫০',
    riskScore: 88, phoneHistory: 'reported', otpVerified: false, pastFakeReports: 4,
    ipFlag: 'vpn', ipLocation: 'অজানা (VPN/প্রক্সি)', ordersFromIp: 7, deviceRepeat: 6, addressMatch: false, codFailures: 5,
  },
  {
    id: 'ORD-9007', customer: 'xyz abc', phone: '01777-123123', total: 4100, channel: 'Facebook', placedAt: 'আজ ৯:৩০',
    riskScore: 79, phoneHistory: 'reported', otpVerified: false, pastFakeReports: 3,
    ipFlag: 'repeat', ipLocation: 'খুলনা, BD', ordersFromIp: 5, deviceRepeat: 4, addressMatch: false, codFailures: 3,
  },
];

/* ── Signal chip ─────────────────────────────────────────────────────────── */
function SignalChip({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone: 'good' | 'warn' | 'bad' }) {
  const toneCls = tone === 'good'
    ? 'text-green-700 bg-green-50 border-green-200'
    : tone === 'warn'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border', toneCls)}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

/* ── Risk gauge ──────────────────────────────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  const tier = tierOf(score);
  const meta = TIER_META[tier];
  const color = tier === 'safe' ? '#22c55e' : tier === 'review' ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/40" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${score} 100`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color }}>{score}</span>
      </div>
      <span className={cn('mt-1 text-[9px] font-bold', meta.color)}>{meta.label}</span>
    </div>
  );
}

export default function FraudDetectionPage() {
  const [tab, setTab] = useState<RiskTier | 'all'>('review');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRules, setShowRules] = useState(true);

  // Auto-rule config
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [flagVpn, setFlagVpn] = useState(true);
  const [flagRepeatIp, setFlagRepeatIp] = useState(true);
  const [confirmThreshold] = useState(30);
  const [blockThreshold] = useState(75);

  const counts = useMemo(() => ({
    safe:   ORDERS.filter(o => tierOf(o.riskScore) === 'safe').length,
    review: ORDERS.filter(o => tierOf(o.riskScore) === 'review').length,
    high:   ORDERS.filter(o => tierOf(o.riskScore) === 'high').length,
  }), []);

  const fakeCaught = ORDERS.filter(o => o.pastFakeReports > 0).length;

  const filtered = ORDERS
    .filter(o => tab === 'all' || tierOf(o.riskScore) === tab)
    .sort((a, b) => b.riskScore - a.riskScore);

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(o => o.id)));
  const toggleOne = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> ফড ডিটেকশন কনসোল
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">IP ট্র্যাকিং + ফোন ভেরিফিকেশন দিয়ে অটো-ডিসিশন — শুধু সন্দেহজনক অর্ডারগুলো আপনি দেখবেন</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ইঞ্জিন সক্রিয়
        </div>
      </div>

      {/* The "alert overload solved" explainer */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div className="text-sm">
          <p className="font-bold text-gray-900">বেশি অ্যালার্ট হলেও ম্যানুয়াল ঝামেলা নেই</p>
          <p className="text-gray-600 mt-0.5 leading-relaxed">
            ইঞ্জিন প্রতিটি অর্ডারকে ৩ ভাগে ভাগ করে — <strong className="text-green-700">নিরাপদ অটো-কনফার্ম</strong>,
            <strong className="text-red-700"> উচ্চ ঝুঁকি অটো-ব্লক</strong>, আর শুধু মাঝখানের
            <strong className="text-amber-700"> সন্দেহজনক ({counts.review}টি)</strong> আপনার রিভিউ কিউতে আসে — সেখানেও বাল্ক একশন দিয়ে এক ক্লিকে হ্যান্ডেল।
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'মোট স্ক্যান', value: ORDERS.length,    icon: Fingerprint, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'অটো-কনফার্ম', value: counts.safe,      icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'রিভিউ কিউ',   value: counts.review,    icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'অটো-ব্লক',    value: counts.high,      icon: ShieldX,     color: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'ফেইক ধরা',    value: fakeCaught,       icon: Ban,         color: 'text-purple-600',bg: 'bg-purple-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Auto-rules engine */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <button onClick={() => setShowRules(v => !v)} className="w-full px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-sm">
            <Settings2 className="w-4 h-4 text-primary" /> অটো-ডিসিশন রুলস
          </span>
          {showRules ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showRules && (
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            {[
              { on: autoConfirm, set: setAutoConfirm, icon: ShieldCheck, color: 'text-green-600',
                title: `অটো-কনফার্ম (ঝুঁকি < ${confirmThreshold})`, desc: 'ভেরিফাইড ফোন + পরিচিত IP হলে নিজে থেকেই কনফার্ম' },
              { on: autoBlock, set: setAutoBlock, icon: ShieldX, color: 'text-red-600',
                title: `অটো-ব্লক (ঝুঁকি > ${blockThreshold})`, desc: 'ব্ল্যাকলিস্ট নম্বর বা একাধিক ফেইক রিপোর্ট হলে হোল্ড/বাতিল' },
              { on: flagVpn, set: setFlagVpn, icon: Wifi, color: 'text-amber-600',
                title: 'VPN / প্রক্সি ফ্ল্যাগ', desc: 'লুকানো IP থেকে আসা অর্ডার স্বয়ংক্রিয় ফ্ল্যাগ' },
              { on: flagRepeatIp, set: setFlagRepeatIp, icon: Globe, color: 'text-amber-600',
                title: 'একই IP-তে একাধিক অর্ডার', desc: '২৪ ঘণ্টায় একই IP থেকে ৩+ অর্ডার হলে রিভিউতে পাঠাও' },
            ].map(r => {
              const Icon = r.icon;
              return (
                <div key={r.title} className={cn('flex items-start gap-3 rounded-xl border p-3 transition-colors', r.on ? 'border-primary/30 bg-primary/5' : 'bg-muted/20')}>
                  <div className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center flex-shrink-0">
                    <Icon className={cn('w-4 h-4', r.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                  <button onClick={() => r.set(v => !v)}
                    className={cn('relative w-10 h-6 rounded-full transition-colors flex-shrink-0', r.on ? 'bg-primary' : 'bg-muted-foreground/30')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', r.on ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tier tabs */}
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {([
          { id: 'review', label: `রিভিউ কিউ (${counts.review})` },
          { id: 'high',   label: `উচ্চ ঝুঁকি (${counts.high})` },
          { id: 'safe',   label: `নিরাপদ (${counts.safe})` },
          { id: 'all',    label: 'সব' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(new Set()); }}
            className={cn('px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar (only meaningful in review queue) */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 sticky top-2 z-10">
          <span className="text-sm font-bold text-primary">{selected.size}টি নির্বাচিত</span>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> সব কনফার্ম
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">
            <XCircle className="w-3.5 h-3.5" /> সব বাতিল
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors">
            <Ban className="w-3.5 h-3.5" /> নম্বর ব্ল্যাকলিস্ট
          </button>
          <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg hover:bg-muted">
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Select-all row */}
      {filtered.length > 0 && (
        <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
          {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
          এই তালিকার সব নির্বাচন করুন
        </button>
      )}

      {/* Order alert cards */}
      <div className="space-y-3">
        {filtered.map(o => {
          const tier = tierOf(o.riskScore);
          const meta = TIER_META[tier];
          const isSel = selected.has(o.id);
          return (
            <div key={o.id} className={cn('rounded-xl border bg-card shadow-sm overflow-hidden transition-all', isSel && 'ring-2 ring-primary/30')}>
              <div className="p-4 flex items-start gap-4">
                {/* Checkbox */}
                <button onClick={() => toggleOne(o.id)} className="mt-1 flex-shrink-0">
                  {isSel ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                </button>

                {/* Risk gauge */}
                <div className="flex-shrink-0"><RiskGauge score={o.riskScore} /></div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm font-mono">{o.id}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', meta.color, meta.bg, meta.border)}>{meta.label}</span>
                    <span className="text-[11px] text-muted-foreground">{o.channel} · {o.placedAt}</span>
                  </div>
                  <p className="text-sm mt-0.5">{o.customer} · <span className="font-mono text-xs">{o.phone}</span> · <span className="font-bold">৳{o.total.toLocaleString()}</span></p>

                  {/* Signals */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {/* phone verification */}
                    {o.otpVerified
                      ? <SignalChip icon={PhoneCall} label="OTP ভেরিফাইড" tone="good" />
                      : <SignalChip icon={PhoneOff} label="ফোন অযাচাইকৃত" tone={o.phoneHistory === 'reported' ? 'bad' : 'warn'} />}
                    {o.phoneHistory === 'reported' && <SignalChip icon={Phone} label={`${o.pastFakeReports} বার ফেইক রিপোর্ট`} tone="bad" />}
                    {o.phoneHistory === 'verified' && <SignalChip icon={Phone} label="পরিচিত গ্রাহক" tone="good" />}

                    {/* IP signals */}
                    {o.ipFlag === 'vpn' && <SignalChip icon={Wifi} label="VPN/প্রক্সি IP" tone="bad" />}
                    {o.ipFlag === 'repeat' && <SignalChip icon={Globe} label={`একই IP-তে ${o.ordersFromIp} অর্ডার`} tone="bad" />}
                    {o.ipFlag === 'new' && <SignalChip icon={Globe} label="নতুন IP" tone="warn" />}
                    {o.ipFlag === 'known' && <SignalChip icon={Globe} label="পরিচিত IP" tone="good" />}
                    <SignalChip icon={MapPin} label={o.ipLocation} tone={o.ipFlag === 'vpn' ? 'bad' : 'good'} />

                    {/* device */}
                    {o.deviceRepeat >= 3 && <SignalChip icon={Smartphone} label={`${o.deviceRepeat} অর্ডার একই ডিভাইস`} tone="bad" />}

                    {/* address + cod */}
                    {!o.addressMatch && <SignalChip icon={MapPin} label="ঠিকানা অসামঞ্জস্য" tone="warn" />}
                    {o.codFailures > 0 && <SignalChip icon={AlertTriangle} label={`${o.codFailures} বার COD ফেরত`} tone={o.codFailures >= 3 ? 'bad' : 'warn'} />}
                  </div>
                </div>

                {/* Per-order actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {tier === 'safe' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold">
                      <RefreshCw className="w-3 h-3" /> অটো-কনফার্মড
                    </span>
                  )}
                  {tier === 'high' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-bold">
                      <Ban className="w-3 h-3" /> অটো-হোল্ড
                    </span>
                  )}
                  <button className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors">
                    <CheckCircle2 className="w-3 h-3" /> কনফার্ম
                  </button>
                  <button className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 transition-colors">
                    <XCircle className="w-3 h-3" /> বাতিল
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold">এই তালিকায় কোনো অর্ডার নেই</p>
            <p className="text-sm mt-1">রিভিউ কিউ খালি — সব অর্ডার অটোমেটিক হ্যান্ডেল হয়েছে ✅</p>
          </div>
        )}
      </div>
    </div>
  );
}
