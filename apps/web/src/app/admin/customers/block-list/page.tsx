'use client';

import { useState } from 'react';
import {
  Shield, ShieldOff, Phone, Globe, Fingerprint, Mail,
  Plus, Upload, Download, Search, Filter, Trash2, Eye,
  AlertTriangle, CheckCircle, XCircle, ChevronDown,
  MoreVertical, Settings, RefreshCw, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
type BlockType  = 'PHONE' | 'IP' | 'FINGERPRINT' | 'EMAIL';
type Severity   = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type BlockStatus = 'ACTIVE' | 'EXPIRED' | 'MANUAL';
type TabId      = 'list' | 'auto' | 'log';

/* ─── Mock data ──────────────────────────────────────────────── */
const BLOCK_LIST: {
  id: string; type: BlockType; value: string; reason: string;
  severity: Severity; status: BlockStatus;
  orders: number; attempts: number; blocked: number;
  addedBy: string; addedAt: string; expiresAt?: string;
  ghost: boolean;
}[] = [
  { id: 'B001', type: 'PHONE',       value: '017XX-XXX123', reason: 'একাধিক ফেইক অর্ডার',     severity: 'CRITICAL', status: 'ACTIVE',  orders: 8,  attempts: 3, blocked: 3, addedBy: 'Auto',    addedAt: '১৩ জুন', ghost: true },
  { id: 'B002', type: 'IP',          value: '103.200.XX.X', reason: 'VPN থেকে ফ্রড',          severity: 'HIGH',     status: 'ACTIVE',  orders: 12, attempts: 5, blocked: 5, addedBy: 'Auto',    addedAt: '১৩ জুন', ghost: false },
  { id: 'B003', type: 'FINGERPRINT', value: 'fp_a1b2c3d4e5', reason: 'ডিভাইস রিজেক্টেড',      severity: 'MEDIUM',   status: 'ACTIVE',  orders: 2,  attempts: 7, blocked: 7, addedBy: 'Admin',   addedAt: '১২ জুন', ghost: true },
  { id: 'B004', type: 'PHONE',       value: '018XX-XXX456', reason: 'COD ডেলিভারি নেয়নি',    severity: 'MEDIUM',   status: 'ACTIVE',  orders: 4,  attempts: 1, blocked: 1, addedBy: 'Admin',   addedAt: '১২ জুন', ghost: false },
  { id: 'B005', type: 'EMAIL',       value: 'fake@temp.io', reason: 'টেম্পোরারি ইমেইল',       severity: 'LOW',      status: 'ACTIVE',  orders: 1,  attempts: 2, blocked: 2, addedBy: 'Auto',    addedAt: '১১ জুন', ghost: false },
  { id: 'B006', type: 'IP',          value: '45.152.XX.XX', reason: 'রিপিট অর্ডার স্প্যাম',  severity: 'HIGH',     status: 'EXPIRED', orders: 20, attempts: 0, blocked: 0, addedBy: 'Auto',    addedAt: '০১ জুন', expiresAt: '০৭ জুন', ghost: false },
  { id: 'B007', type: 'PHONE',       value: '019XX-XXX789', reason: 'গ্রাহক রিকোয়েস্ট',      severity: 'LOW',      status: 'MANUAL',  orders: 0,  attempts: 0, blocked: 0, addedBy: 'Admin',   addedAt: '১০ জুন', ghost: false },
  { id: 'B008', type: 'FINGERPRINT', value: 'fp_x9y8z7w6v5', reason: 'একাধিক অ্যাকাউন্ট',   severity: 'HIGH',     status: 'ACTIVE',  orders: 6,  attempts: 4, blocked: 4, addedBy: 'Auto',    addedAt: '০৯ জুন', ghost: true },
];

const BLOCK_LOG: {
  id: string; blockId: string; value: string; type: BlockType;
  event: string; time: string; orderId?: string;
}[] = [
  { id: 'L001', blockId: 'B001', value: '017XX-XXX123', type: 'PHONE',       event: 'চেকআউট ব্লক',   time: '৫ মিনিট আগে',   orderId: 'ORD-5512' },
  { id: 'L002', blockId: 'B002', value: '103.200.XX.X', type: 'IP',          event: 'পেজ লোড ব্লক',  time: '১২ মিনিট আগে' },
  { id: 'L003', blockId: 'B003', value: 'fp_a1b2c3d4e5', type: 'FINGERPRINT', event: 'লগইন ব্লক',     time: '২৫ মিনিট আগে' },
  { id: 'L004', blockId: 'B001', value: '017XX-XXX123', type: 'PHONE',       event: 'চেকআউট ব্লক',   time: '৩৫ মিনিট আগে',  orderId: 'ORD-5509' },
  { id: 'L005', blockId: 'B004', value: '018XX-XXX456', type: 'PHONE',       event: 'চেকআউট ব্লক',   time: '১ ঘন্টা আগে',   orderId: 'ORD-5504' },
];

const TYPE_META: Record<BlockType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PHONE:       { label: 'ফোন',         icon: Phone,       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  IP:          { label: 'আইপি',         icon: Globe,       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  FINGERPRINT: { label: 'ডিভাইস',      icon: Fingerprint, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  EMAIL:       { label: 'ইমেইল',       icon: Mail,        color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200' },
};

const SEVERITY_META: Record<Severity, { label: string; color: string; dot: string }> = {
  LOW:      { label: 'লো',        color: 'text-gray-500',   dot: 'bg-gray-400' },
  MEDIUM:   { label: 'মিডিয়াম',  color: 'text-amber-600',  dot: 'bg-amber-400' },
  HIGH:     { label: 'হাই',       color: 'text-orange-600', dot: 'bg-orange-500' },
  CRITICAL: { label: 'ক্রিটিক্যাল', color: 'text-red-600', dot: 'bg-red-500 animate-pulse' },
};

/* ─── Add Modal ──────────────────────────────────────────────── */
function AddModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<BlockType>('PHONE');
  const [value, setValue]   = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [ghost, setGhost]   = useState(false);
  const [expires, setExpires] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-red-500" /> নতুন ব্লক এন্ট্রি
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2">ব্লক টাইপ</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_META) as BlockType[]).map(t => {
                const m = TYPE_META[t];
                const Icon = m.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={cn('flex items-center gap-2 p-3 rounded-xl border text-left transition-all',
                      type === t ? 'border-primary bg-primary/5' : 'hover:border-primary/40')}>
                    <Icon className={cn('w-4 h-4', m.color)} />
                    <span className="text-sm font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold">
              {TYPE_META[type].label} মান
            </label>
            <input value={value} onChange={e => setValue(e.target.value)}
              placeholder={type === 'PHONE' ? '01XXXXXXXXX' : type === 'IP' ? '192.168.0.1' : type === 'EMAIL' ? 'email@domain.com' : 'fp_xxxxxxxx'}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold">কারণ</label>
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder="কেন ব্লক করা হচ্ছে?"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold">সিভেরিটি</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="LOW">লো</option>
                <option value="MEDIUM">মিডিয়াম</option>
                <option value="HIGH">হাই</option>
                <option value="CRITICAL">ক্রিটিক্যাল</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold">মেয়াদ শেষ (ঐচ্ছিক)</label>
              <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 cursor-pointer">
            <input type="checkbox" checked={ghost} onChange={e => setGhost(e.target.checked)} className="rounded" />
            <div>
              <p className="text-sm font-semibold">Ghost Block (সাইলেন্ট)</p>
              <p className="text-[11px] text-muted-foreground">ব্যবহারকারীকে ব্লক না জানিয়ে ইনভিজিবল ব্যারিয়ার দেখাবে</p>
            </div>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">
              বাতিল
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">
              ব্লক করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Auto-detection rules ───────────────────────────────────── */
const AUTO_RULES = [
  { id: 'r1', label: 'একই ফোনে ৩+ ফেইক অর্ডার',      desc: 'ডেলিভারি ব্যর্থ হলে ফোন অটো-ব্লক করুন',  enabled: true,  severity: 'HIGH' as Severity },
  { id: 'r2', label: 'VPN IP থেকে চেকআউট',            desc: 'VPN/Proxy সনাক্ত হলে IP ব্লক করুন',        enabled: true,  severity: 'MEDIUM' as Severity },
  { id: 'r3', label: '১ ঘন্টায় ৫+ অর্ডার (একই IP)',  desc: 'স্প্যামিং সনাক্ত হলে IP ব্লক করুন',       enabled: true,  severity: 'HIGH' as Severity },
  { id: 'r4', label: 'নতুন অ্যাকাউন্ট + হাই ভ্যালু',  desc: '৫০০০+ টাকা COD + নতুন ফোন → রিভিউতে',     enabled: false, severity: 'MEDIUM' as Severity },
  { id: 'r5', label: 'টেম্পোরারি ইমেইল ডোমেইন',       desc: 'temp-mail, mailinator ইত্যাদি ব্লক',       enabled: true,  severity: 'LOW' as Severity },
  { id: 'r6', label: 'একই ডিভাইস থেকে ৩+ অ্যাকাউন্ট', desc: 'ফিঙ্গারপ্রিন্ট মিলে যাওয়া ডিভাইস',      enabled: false, severity: 'HIGH' as Severity },
];

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

/* ─── Main Page ──────────────────────────────────────────────── */
export default function BlockListPage() {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [showAdd, setShowAdd]     = useState(false);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState<BlockType | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [rules, setRules] = useState(AUTO_RULES);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = BLOCK_LIST.filter(b => {
    if (b.status === 'EXPIRED') return false;
    if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
    if (severityFilter !== 'ALL' && b.severity !== severityFilter) return false;
    if (search && !b.value.toLowerCase().includes(search.toLowerCase()) &&
        !b.reason.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const stats = {
    total:    BLOCK_LIST.filter(b => b.status === 'ACTIVE').length,
    phone:    BLOCK_LIST.filter(b => b.type === 'PHONE' && b.status === 'ACTIVE').length,
    ip:       BLOCK_LIST.filter(b => b.type === 'IP' && b.status === 'ACTIVE').length,
    ghost:    BLOCK_LIST.filter(b => b.ghost && b.status === 'ACTIVE').length,
    blocked:  BLOCK_LIST.reduce((s, b) => s + b.blocked, 0),
  };

  return (
    <div className="space-y-5 pb-6">
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-black flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" /> Customer Block List
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">ফোন, IP, ডিভাইস ও ইমেইল ব্লক করুন</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> CSV ইম্পোর্ট
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">
            <Plus className="w-4 h-4" /> নতুন ব্লক
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'সক্রিয় ব্লক',    value: stats.total,    icon: ShieldOff, color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'ফোন ব্লক',        value: stats.phone,    icon: Phone,     color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'IP ব্লক',         value: stats.ip,       icon: Globe,     color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Ghost Block',     value: stats.ghost,    icon: Shield,    color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'আজ ব্লক হয়েছে',  value: stats.blocked,  icon: XCircle,   color: 'text-gray-700',   bg: 'bg-gray-50' },
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
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {([
          { id: 'list', label: `ব্লক লিস্ট (${stats.total})` },
          { id: 'auto', label: 'অটো নিয়ম' },
          { id: 'log',  label: 'ব্লক লগ' },
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
                placeholder="মান বা কারণ সার্চ করুন..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold">
              <option value="ALL">সব টাইপ</option>
              <option value="PHONE">ফোন</option>
              <option value="IP">আইপি</option>
              <option value="FINGERPRINT">ডিভাইস</option>
              <option value="EMAIL">ইমেইল</option>
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as typeof severityFilter)}
              className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold">
              <option value="ALL">সব সিভেরিটি</option>
              <option value="CRITICAL">ক্রিটিক্যাল</option>
              <option value="HIGH">হাই</option>
              <option value="MEDIUM">মিডিয়াম</option>
              <option value="LOW">লো</option>
            </select>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border transition-colors">
              <Download className="w-3.5 h-3.5" /> এক্সপোর্ট
            </button>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-bold text-primary">{selected.length}টি নির্বাচিত</span>
              <div className="flex gap-2 ml-auto">
                <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
                  সিলেক্টেড মুছুন
                </button>
                <button onClick={() => setSelected([])}
                  className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
                  বাতিল
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox"
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={e => setSelected(e.target.checked ? filtered.map(b => b.id) : [])}
                        className="rounded border-border" />
                    </th>
                    {['টাইপ', 'মান', 'কারণ', 'সিভেরিটি', 'স্ট্যাটাস', 'ব্লক', 'যোগ করা', ''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(b => {
                    const tm = TYPE_META[b.type];
                    const TIcon = tm.icon;
                    const sm2 = SEVERITY_META[b.severity];
                    return (
                      <tr key={b.id} className={cn('hover:bg-muted/20 transition-colors', selected.includes(b.id) && 'bg-primary/5')}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleSelect(b.id)}
                            className="rounded border-border" />
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold', tm.bg, tm.color)}>
                            <TIcon className="w-3 h-3" /> {tm.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-mono font-semibold">{b.value}</p>
                          {b.ghost && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold mt-0.5">
                              <Eye className="w-2.5 h-2.5" /> Ghost
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 max-w-[160px]">
                          <p className="text-xs text-muted-foreground truncate">{b.reason}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn('inline-flex items-center gap-1 text-xs font-bold', sm2.color)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', sm2.dot)} />
                            {sm2.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                            b.status === 'ACTIVE'  ? 'bg-red-50 border border-red-200 text-red-600' :
                            b.status === 'EXPIRED' ? 'bg-gray-50 border border-gray-200 text-gray-500' :
                            'bg-blue-50 border border-blue-200 text-blue-600')}>
                            {b.status === 'ACTIVE' ? 'সক্রিয়' : b.status === 'EXPIRED' ? 'মেয়াদ শেষ' : 'ম্যানুয়াল'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-bold text-red-600">{b.blocked}</span>
                          <p className="text-[10px] text-muted-foreground">বার</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{b.addedAt}</td>
                        <td className="px-3 py-3">
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                          </button>
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

      {/* ── Auto Rules Tab ── */}
      {activeTab === 'auto' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Settings className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-700">অটো-ডিটেকশন ইঞ্জিন</p>
              <p className="text-xs text-blue-600 mt-0.5">
                এই নিয়মগুলো রিয়েলটাইমে চেক করে সন্দেহজনক আচরণ সনাক্ত করলে স্বয়ংক্রিয়ভাবে ব্লক করে।
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {rules.map((rule, idx) => {
              const sm2 = SEVERITY_META[rule.severity];
              return (
                <div key={rule.id} className={cn('bg-card rounded-xl border p-4 transition-opacity', !rule.enabled && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold">{rule.label}</p>
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold', sm2.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', sm2.dot)} />
                          {sm2.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
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
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              <CheckCircle className="w-4 h-4" /> নিয়ম সেভ করুন
            </button>
          </div>
        </div>
      )}

      {/* ── Log Tab ── */}
      {activeTab === 'log' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> রিয়েলটাইম ব্লক লগ
            </h3>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/20">
                {['সময়', 'টাইপ', 'মান', 'ইভেন্ট', 'অর্ডার'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {BLOCK_LOG.map(l => {
                const tm = TYPE_META[l.type];
                const TIcon = tm.icon;
                return (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.time}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold', tm.bg, tm.color)}>
                        <TIcon className="w-3 h-3" /> {tm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{l.value}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
                        <XCircle className="w-2.5 h-2.5" /> {l.event}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {l.orderId ?? <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
