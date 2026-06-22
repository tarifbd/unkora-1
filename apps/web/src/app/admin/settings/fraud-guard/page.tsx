'use client';

import { useState } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp,
  Phone, Globe, Fingerprint, Clock, Package, CreditCard,
  Users, Zap, Settings, CheckCircle, XCircle, Eye, RefreshCw,
  BarChart3, Filter, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
type RiskTier   = 'SAFE' | 'REVIEW' | 'HIGH';
type IncidentStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
type TabId      = 'rules' | 'incidents' | 'stats';

/* ─── Mock data ──────────────────────────────────────────────── */
const INCIDENTS: {
  id: string; orderId: string; customer: string; phone: string;
  amount: number; score: number; tier: RiskTier;
  triggered: string[]; status: IncidentStatus; time: string;
}[] = [
  { id: 'FI001', orderId: 'ORD-5512', customer: 'অজানা ব্যবহারকারী', phone: '017XX-XXX901', amount: 8500, score: 87, tier: 'HIGH',   triggered: ['নতুন ফোন + হাই ভ্যালু', 'VPN IP'],           status: 'OPEN',      time: '৫ মিনিট আগে' },
  { id: 'FI002', orderId: 'ORD-5509', customer: 'রাফিউল ইসলাম',     phone: '018XX-XXX234', amount: 2100, score: 54, tier: 'REVIEW', triggered: ['ফোন ভেলোসিটি'],                              status: 'OPEN',      time: '১৫ মিনিট আগে' },
  { id: 'FI003', orderId: 'ORD-5505', customer: 'নাসরিন আক্তার',    phone: '019XX-XXX567', amount: 3600, score: 72, tier: 'HIGH',   triggered: ['একই ঠিকানা', 'COD লিমিট', 'নতুন অ্যাকাউন্ট'],  status: 'OPEN',      time: '২২ মিনিট আগে' },
  { id: 'FI004', orderId: 'ORD-5498', customer: 'করিম হোসেন',       phone: '016XX-XXX890', amount: 1200, score: 61, tier: 'REVIEW', triggered: ['ডুপ্লিকেট ঠিকানা'],                          status: 'RESOLVED',  time: '১ ঘন্টা আগে' },
  { id: 'FI005', orderId: 'ORD-5491', customer: 'সাব্বির আহমেদ',    phone: '015XX-XXX123', amount: 950,  score: 45, tier: 'REVIEW', triggered: ['রিপিট ডিভাইস'],                              status: 'DISMISSED', time: '৩ ঘন্টা আগে' },
];

const TIER_META: Record<RiskTier, { label: string; color: string; bg: string; border: string; score: string }> = {
  SAFE:   { label: 'নিরাপদ',   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200', score: '0–30' },
  REVIEW: { label: 'রিভিউ',    color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', score: '31–70' },
  HIGH:   { label: 'হাই রিস্ক', color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',   score: '71–100' },
};

/* ─── Rule cards data ────────────────────────────────────────── */
const RULE_GROUPS = [
  {
    group: 'পরিমাণ ও COD',
    icon: CreditCard,
    color: 'text-blue-600',
    rules: [
      { id: 'max_qty',       label: 'অ্যাডভান্সড কোয়ান্টিটি লিমিট',    desc: 'এক অর্ডারে সর্বোচ্চ পণ্য সংখ্যা',          enabled: true,  score: 25, config: { label: 'সর্বোচ্চ পণ্য', value: '10', unit: 'টি' } },
      { id: 'cod_limit',     label: 'COD অর্ডার লিমিট',                  desc: 'নির্দিষ্ট পরিমাণের বেশি COD ব্লক',          enabled: true,  score: 40, config: { label: 'সর্বোচ্চ COD', value: '5000', unit: '৳' } },
      { id: 'high_val_new',  label: 'নতুন + হাই ভ্যালু',                 desc: 'নতুন ফোনে উচ্চ মূল্যের COD অর্ডার',        enabled: true,  score: 50, config: { label: 'থ্রেশহোল্ড', value: '3000', unit: '৳' } },
    ],
  },
  {
    group: 'ফোন ও পরিচয়',
    icon: Phone,
    color: 'text-purple-600',
    rules: [
      { id: 'phone_vel',     label: 'ফোন ভেলোসিটি',                     desc: '১ ঘন্টায় একই ফোন থেকে অর্ডারের সীমা',       enabled: true,  score: 35, config: { label: 'সর্বোচ্চ অর্ডার/ঘন্টা', value: '3', unit: 'টি' } },
      { id: 'otp_skip',      label: 'OTP স্কিপ',                         desc: 'OTP ভেরিফাই না করে অর্ডার করলে ফ্ল্যাগ',   enabled: false, score: 20, config: null },
      { id: 'blocklist',     label: 'ব্লক লিস্ট মিল',                   desc: 'ব্লক লিস্টের ফোন/IP/ডিভাইস',               enabled: true,  score: 100, config: null },
    ],
  },
  {
    group: 'ঠিকানা ও লোকেশন',
    icon: Globe,
    color: 'text-green-600',
    rules: [
      { id: 'addr_dup',      label: 'ডুপ্লিকেট ঠিকানা',                 desc: 'একই ঠিকানায় একাধিক COD অর্ডার',            enabled: true,  score: 30, config: { label: 'সর্বোচ্চ ঠিকানা/দিন', value: '2', unit: 'টি' } },
      { id: 'vpn_proxy',     label: 'VPN / Proxy',                       desc: 'VPN বা প্রক্সি থেকে চেকআউট',               enabled: true,  score: 45, config: null },
      { id: 'ip_velocity',   label: 'IP ভেলোসিটি',                      desc: 'একই IP থেকে দ্রুত একাধিক অর্ডার',          enabled: true,  score: 35, config: { label: 'সর্বোচ্চ অর্ডার/ঘন্টা', value: '5', unit: 'টি' } },
    ],
  },
  {
    group: 'ডিভাইস ও আচরণ',
    icon: Fingerprint,
    color: 'text-amber-600',
    rules: [
      { id: 'fp_multi',      label: 'একাধিক অ্যাকাউন্ট',                desc: 'একই ডিভাইস থেকে একাধিক অ্যাকাউন্ট',        enabled: false, score: 40, config: null },
      { id: 'speed_checkout', label: 'দ্রুত চেকআউট',                   desc: '৫ সেকেন্ডের কম সময়ে চেকআউট সম্পন্ন',      enabled: false, score: 20, config: { label: 'ন্যূনতম সময়', value: '5', unit: 'সেকেন্ড' } },
      { id: 'cod_history',   label: 'COD ব্যর্থতার ইতিহাস',             desc: 'আগে COD না নেওয়ার রেকর্ড আছে',             enabled: true,  score: 60, config: { label: 'সর্বোচ্চ ব্যর্থতা', value: '2', unit: 'বার' } },
    ],
  },
];

/* ─── Helper components ──────────────────────────────────────── */
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

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-bold text-muted-foreground w-6 text-right">{score}</span>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function FraudGuardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('rules');
  const [rules, setRules] = useState(RULE_GROUPS.map(g => ({ ...g, rules: g.rules.map(r => ({ ...r })) })));
  const [incidentFilter, setIncidentFilter] = useState<IncidentStatus | 'ALL'>('OPEN');
  const [saved, setSaved] = useState(false);

  const openCount = INCIDENTS.filter(i => i.status === 'OPEN').length;

  function toggleRule(gIdx: number, rIdx: number) {
    setRules(prev => prev.map((g, gi) =>
      gi !== gIdx ? g : {
        ...g,
        rules: g.rules.map((r, ri) => ri !== rIdx ? r : { ...r, enabled: !r.enabled }),
      }
    ));
  }

  function updateRuleValue(gIdx: number, rIdx: number, value: string) {
    setRules(prev => prev.map((g, gi) =>
      gi !== gIdx ? g : {
        ...g,
        rules: g.rules.map((r, ri) => {
          if (ri !== rIdx || !r.config) return r;
          return { ...r, config: { ...r.config, value } };
        }),
      }
    ));
  }

  const filteredIncidents = INCIDENTS.filter(i =>
    incidentFilter === 'ALL' ? true : i.status === incidentFilter
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-black flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" /> Fraud Guard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">মাল্টি-রুল ফ্রড ডিটেকশন ইঞ্জিন — রিয়েলটাইমে স্বয়ংক্রিয় সিদ্ধান্ত</p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
            <AlertTriangle className="w-3.5 h-3.5" /> {openCount}টি ইনসিডেন্ট রিভিউ পেন্ডিং
          </div>
        )}
      </div>

      {/* 3-tier decision engine explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(TIER_META) as RiskTier[]).map(tier => {
          const m = TIER_META[tier];
          const icons = { SAFE: ShieldCheck, REVIEW: Shield, HIGH: ShieldAlert };
          const Icon = icons[tier];
          const actions = {
            SAFE:   'স্বয়ংক্রিয় কনফার্ম',
            REVIEW: 'ম্যানুয়াল রিভিউ কিউ',
            HIGH:   'স্বয়ংক্রিয় হোল্ড',
          };
          return (
            <div key={tier} className={cn('rounded-xl border p-4', m.bg, m.border)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-5 h-5', m.color)} />
                <span className={cn('text-sm font-black', m.color)}>{m.label}</span>
                <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full', m.bg, m.color, 'border', m.border)}>
                  স্কোর {m.score}
                </span>
              </div>
              <p className={cn('text-xs font-semibold', m.color)}>→ {actions[tier]}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {([
          { id: 'rules',     label: 'নিয়মাবলী' },
          { id: 'incidents', label: `ইনসিডেন্ট (${openCount} খোলা)` },
          { id: 'stats',     label: 'স্ট্যাটিসটিক্স' },
        ] as { id: TabId; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('flex-1 py-2.5 rounded-lg text-xs font-bold transition-all',
              activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.map((group, gIdx) => {
            const GIcon = group.icon;
            return (
              <div key={group.group} className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
                  <GIcon className={cn('w-4 h-4', group.color)} />
                  <h3 className="font-bold text-sm">{group.group}</h3>
                </div>
                <div className="divide-y">
                  {group.rules.map((rule, rIdx) => (
                    <div key={rule.id} className={cn('p-4 transition-opacity', !rule.enabled && 'opacity-50')}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold">{rule.label}</p>
                            <ScoreBar score={rule.score} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                          {rule.enabled && rule.config && (
                            <div className="flex items-center gap-2 mt-2">
                              <label className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {rule.config.label}:
                              </label>
                              <input
                                type="number"
                                value={rule.config.value}
                                onChange={e => updateRuleValue(gIdx, rIdx, e.target.value)}
                                className="w-20 rounded-lg border bg-background px-2 py-1 text-xs font-mono"
                              />
                              <span className="text-[11px] text-muted-foreground">{rule.config.unit}</span>
                            </div>
                          )}
                        </div>
                        <Toggle checked={rule.enabled} onChange={() => toggleRule(gIdx, rIdx)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
              className={cn('flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all',
                saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
              {saved ? <><CheckCircle className="w-4 h-4" /> সেভ হয়েছে!</> : 'নিয়ম সেভ করুন'}
            </button>
          </div>
        </div>
      )}

      {/* ── Incidents Tab ── */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(['ALL', 'OPEN', 'RESOLVED', 'DISMISSED'] as (IncidentStatus | 'ALL')[]).map(s => (
                <button key={s} onClick={() => setIncidentFilter(s)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    incidentFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                  {s === 'ALL' ? 'সব' : s === 'OPEN' ? 'খোলা' : s === 'RESOLVED' ? 'সমাধান' : 'বাতিল'}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border ml-auto transition-colors">
              <Download className="w-3.5 h-3.5" /> এক্সপোর্ট
            </button>
          </div>

          <div className="space-y-3">
            {filteredIncidents.map(inc => {
              const tm = TIER_META[inc.tier];
              const TIcon = inc.tier === 'SAFE' ? ShieldCheck : inc.tier === 'REVIEW' ? Shield : ShieldAlert;
              return (
                <div key={inc.id} className={cn('rounded-xl border p-4 bg-card', inc.status === 'OPEN' && inc.tier === 'HIGH' && 'border-red-200')}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TIcon className={cn('w-4 h-4 flex-shrink-0', tm.color)} />
                        <span className="text-sm font-black">{inc.orderId}</span>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', tm.bg, tm.border, tm.color)}>
                          স্কোর: {inc.score}
                        </span>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                          inc.status === 'OPEN'      ? 'bg-red-50 border border-red-200 text-red-600' :
                          inc.status === 'RESOLVED'  ? 'bg-green-50 border border-green-200 text-green-600' :
                          'bg-gray-50 border border-gray-200 text-gray-500')}>
                          {inc.status === 'OPEN' ? 'খোলা' : inc.status === 'RESOLVED' ? 'সমাধান' : 'বাতিল'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs font-semibold">{inc.customer}</span>
                        <span className="text-xs text-muted-foreground font-mono">{inc.phone}</span>
                        <span className="text-xs font-black">৳{inc.amount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{inc.time}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {inc.triggered.map(r => (
                          <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                            <AlertTriangle className="w-2.5 h-2.5" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    {inc.status === 'OPEN' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> হোল্ড
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors">
                          <Eye className="w-3.5 h-3.5" /> বিস্তারিত
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats Tab ── */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'আজ স্ক্যান',    value: '247',  sub: 'অর্ডার', icon: Zap,        color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'ফ্ল্যাগড',      value: '18',   sub: 'ইনসিডেন্ট', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'অটো-ব্লক',      value: '6',    sub: 'হাই রিস্ক', icon: ShieldAlert, color: 'text-red-600',  bg: 'bg-red-50' },
              { label: 'সাশ্রয় (৳)',    value: '৳৪৮,৫০০', sub: 'ফ্রড থেকে', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
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

          {/* Rule hit frequency */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> নিয়ম হিট ফ্রিকোয়েন্সি (এই সপ্তাহ)
            </h3>
            <div className="space-y-3">
              {[
                { label: 'COD লিমিট',          hits: 42, max: 50 },
                { label: 'ফোন ভেলোসিটি',         hits: 31, max: 50 },
                { label: 'VPN / Proxy',          hits: 28, max: 50 },
                { label: 'নতুন + হাই ভ্যালু',     hits: 19, max: 50 },
                { label: 'ব্লক লিস্ট মিল',        hits: 15, max: 50 },
                { label: 'ডুপ্লিকেট ঠিকানা',      hits: 12, max: 50 },
                { label: 'COD ব্যর্থতার ইতিহাস',  hits: 8,  max: 50 },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-40 flex-shrink-0 truncate">{r.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(r.hits / r.max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{r.hits}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
