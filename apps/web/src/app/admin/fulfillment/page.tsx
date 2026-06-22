'use client';

import { useState, useMemo } from 'react';
import {
  LayoutGrid, Warehouse, Truck, RotateCcw, BarChart3, Search, Filter, CheckSquare, Square,
  ArrowRightLeft, Plus, Package, MapPin, Zap, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, X, DollarSign, Boxes, ChevronRight, Star, RefreshCw, Printer, Send,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ----------------------------------------------------------------------------
 * Fulfillment & Operations Hub
 * Unified Order Cockpit · Multi-Warehouse · Smart Courier Engine · RTO Tracker · Ops Analytics
 * -------------------------------------------------------------------------- */

type ModuleTab = 'cockpit' | 'warehouses' | 'courier' | 'rto' | 'analytics';

const MODULES: { id: ModuleTab; label: string; icon: React.ElementType }[] = [
  { id: 'cockpit',    label: 'অর্ডার ককপিট',   icon: LayoutGrid },
  { id: 'warehouses', label: 'মাল্টি-গুদাম',     icon: Warehouse },
  { id: 'courier',    label: 'স্মার্ট কুরিয়ার', icon: Truck },
  { id: 'rto',        label: 'RTO ট্র্যাকার',    icon: RotateCcw },
  { id: 'analytics',  label: 'অপস অ্যানালিটিক্স', icon: BarChart3 },
];

/* ============================ 1. ORDER COCKPIT ============================ */

type OrderChannel = 'website' | 'facebook' | 'whatsapp' | 'marketplace' | 'instagram';
type OrderState = 'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered';

interface CockpitOrder {
  id: string;
  customer: string;
  channel: OrderChannel;
  state: OrderState;
  items: number;
  total: number;
  warehouse: string;
  courier: string;
  placedAt: string;
}

const CHANNEL_META: Record<OrderChannel, { label: string; color: string; bg: string }> = {
  website:     { label: 'ওয়েবসাইট',    color: 'text-blue-700',    bg: 'bg-blue-100' },
  facebook:    { label: 'Facebook',     color: 'text-indigo-700',  bg: 'bg-indigo-100' },
  whatsapp:    { label: 'WhatsApp',     color: 'text-green-700',   bg: 'bg-green-100' },
  marketplace: { label: 'মার্কেটপ্লেস', color: 'text-purple-700',  bg: 'bg-purple-100' },
  instagram:   { label: 'Instagram',    color: 'text-pink-700',    bg: 'bg-pink-100' },
};

const ORDER_STATE: Record<OrderState, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'অপেক্ষমাণ',    color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
  confirmed:  { label: 'নিশ্চিত',       color: 'text-blue-700',   bg: 'bg-blue-50',   dot: 'bg-blue-500' },
  packed:     { label: 'প্যাকড',        color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  dispatched: { label: 'পাঠানো হয়েছে', color: 'text-cyan-700',   bg: 'bg-cyan-50',   dot: 'bg-cyan-500' },
  delivered:  { label: 'ডেলিভার্ড',    color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
};

const COCKPIT_ORDERS: CockpitOrder[] = [
  { id: 'ORD-7821', customer: 'রাফিউল ইসলাম', channel: 'website',     state: 'pending',    items: 3, total: 2840, warehouse: 'ঢাকা মূল',      courier: '—',         placedAt: 'আজ ১০:২০' },
  { id: 'ORD-7820', customer: 'নাসরিন আক্তার', channel: 'facebook',    state: 'confirmed',  items: 1, total: 650,  warehouse: 'ঢাকা মূল',      courier: 'Pathao',    placedAt: 'আজ ৯:৫৫' },
  { id: 'ORD-7819', customer: 'করিম হোসেন',   channel: 'whatsapp',    state: 'packed',     items: 2, total: 1990, warehouse: 'চট্টগ্রাম',     courier: 'Steadfast', placedAt: 'আজ ৯:১০' },
  { id: 'ORD-7818', customer: 'সাব্বির আহমেদ', channel: 'marketplace', state: 'dispatched', items: 4, total: 4200, warehouse: 'ঢাকা মূল',      courier: 'RedX',      placedAt: 'আজ ৮:৩০' },
  { id: 'ORD-7817', customer: 'ফাতিমা খানম',  channel: 'instagram',   state: 'confirmed',  items: 1, total: 1250, warehouse: 'সিলেট',         courier: 'Pathao',    placedAt: 'গতকাল' },
  { id: 'ORD-7816', customer: 'তানভির হাসান',  channel: 'website',     state: 'delivered',  items: 2, total: 3100, warehouse: 'ঢাকা মূল',      courier: 'Steadfast', placedAt: 'গতকাল' },
  { id: 'ORD-7815', customer: 'সুমনা বেগম',    channel: 'facebook',    state: 'pending',    items: 5, total: 5600, warehouse: 'চট্টগ্রাম',     courier: '—',         placedAt: 'গতকাল' },
  { id: 'ORD-7814', customer: 'আলামিন শেখ',   channel: 'whatsapp',    state: 'packed',     items: 1, total: 480,  warehouse: 'ঢাকা মূল',      courier: 'RedX',      placedAt: '২ দিন আগে' },
];

function OrderCockpit() {
  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<OrderState | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = COCKPIT_ORDERS
    .filter(o => channelFilter === 'all' || o.channel === channelFilter)
    .filter(o => stateFilter === 'all' || o.state === stateFilter)
    .filter(o => !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.includes(search));

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map(o => o.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pendingCount = COCKPIT_ORDERS.filter(o => o.state === 'pending').length;
  const unassigned = COCKPIT_ORDERS.filter(o => o.courier === '—').length;

  return (
    <div className="space-y-4">
      {/* Channel mix strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.keys(CHANNEL_META) as OrderChannel[]).map(ch => {
          const count = COCKPIT_ORDERS.filter(o => o.channel === ch).length;
          const meta = CHANNEL_META[ch];
          return (
            <button key={ch} onClick={() => setChannelFilter(channelFilter === ch ? 'all' : ch)}
              className={cn('rounded-xl border p-3 text-left transition-all',
                channelFilter === ch ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30')}>
              <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1', meta.color, meta.bg)}>{meta.label}</span>
              <p className="text-xl font-black">{count}</p>
              <p className="text-[10px] text-muted-foreground">অর্ডার</p>
            </button>
          );
        })}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="অর্ডার ID বা গ্রাহক খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {(['all', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered'] as const).map(s => (
            <button key={s} onClick={() => setStateFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                stateFilter === s ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
              {s === 'all' ? 'সব অবস্থা' : ORDER_STATE[s as OrderState]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-bold text-primary">{selected.size}টি অর্ডার নির্বাচিত</span>
          <div className="flex-1" />
          {[
            { label: 'নিশ্চিত করুন', icon: CheckCircle2 },
            { label: 'কুরিয়ার অ্যাসাইন', icon: Truck },
            { label: 'লেবেল প্রিন্ট', icon: Printer },
            { label: 'প্যাকড চিহ্নিত', icon: Package },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs font-bold hover:border-primary/40 transition-colors">
                <Icon className="w-3.5 h-3.5" /> {a.label}
              </button>
            );
          })}
          <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Orders table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-[11px] uppercase text-muted-foreground">
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll}>
                    {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-semibold">অর্ডার</th>
                <th className="px-3 py-3 text-left font-semibold">চ্যানেল</th>
                <th className="px-3 py-3 text-left font-semibold">গুদাম</th>
                <th className="px-3 py-3 text-left font-semibold">কুরিয়ার</th>
                <th className="px-3 py-3 text-right font-semibold">মোট</th>
                <th className="px-3 py-3 text-center font-semibold">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(o => {
                const ch = CHANNEL_META[o.channel];
                const st = ORDER_STATE[o.state];
                const isSel = selected.has(o.id);
                return (
                  <tr key={o.id} className={cn('hover:bg-muted/20 transition-colors', isSel && 'bg-primary/5')}>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleOne(o.id)}>
                        {isSel ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold font-mono text-xs">{o.id}</p>
                      <p className="text-[11px] text-muted-foreground">{o.customer} · {o.items} পণ্য · {o.placedAt}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', ch.color, ch.bg)}>{ch.label}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">{o.warehouse}</td>
                    <td className="px-3 py-3 text-xs">{o.courier === '—' ? <span className="text-amber-600 font-bold">অ্যাসাইন বাকি</span> : o.courier}</td>
                    <td className="px-3 py-3 text-right font-bold">৳{o.total.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', st.color, st.bg)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} /> {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {pendingCount} অপেক্ষমাণ</span>
        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-500" /> {unassigned} কুরিয়ার অ্যাসাইন বাকি</span>
      </div>
    </div>
  );
}

/* ============================ 2. MULTI-WAREHOUSE ============================ */

interface WarehouseStock {
  id: string;
  name: string;
  city: string;
  isDefault: boolean;
  skus: number;
  units: number;
  lowStock: number;
  capacity: number;
}

const WAREHOUSES: WarehouseStock[] = [
  { id: 'WH-1', name: 'ঢাকা মূল গুদাম',  city: 'ঢাকা',      isDefault: true,  skus: 1240, units: 8650, lowStock: 18, capacity: 78 },
  { id: 'WH-2', name: 'চট্টগ্রাম হাব',   city: 'চট্টগ্রাম', isDefault: false, skus: 720,  units: 4200, lowStock: 9,  capacity: 54 },
  { id: 'WH-3', name: 'সিলেট ডিপো',      city: 'সিলেট',     isDefault: false, skus: 410,  units: 1980, lowStock: 24, capacity: 41 },
];

const TRANSFER_LOG = [
  { id: 'TRF-091', product: 'Python Programming — 3rd Ed.', from: 'ঢাকা মূল', to: 'চট্টগ্রাম', qty: 50, date: 'আজ', status: 'in_transit' },
  { id: 'TRF-090', product: 'ক্লাস ৯-১০ গণিত',            from: 'ঢাকা মূল', to: 'সিলেট',     qty: 120, date: 'গতকাল', status: 'completed' },
  { id: 'TRF-089', product: 'English Grammar in Use',     from: 'চট্টগ্রাম', to: 'ঢাকা মূল',  qty: 30, date: '২ দিন আগে', status: 'completed' },
];

function MultiWarehouse() {
  const [showTransfer, setShowTransfer] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">{WAREHOUSES.length}টি গুদামে স্টক বিতরণ ও ট্রান্সফার পরিচালনা</p>
        <button onClick={() => setShowTransfer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow hover:opacity-90 transition-opacity">
          <ArrowRightLeft className="w-4 h-4" /> স্টক ট্রান্সফার
        </button>
      </div>

      {/* Warehouse cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {WAREHOUSES.map(w => (
          <div key={w.id} className={cn('rounded-xl border bg-card p-5 shadow-sm', w.isDefault && 'border-primary/30')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.city}</p>
                </div>
              </div>
              {w.isDefault && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-lg font-black">{w.skus.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">SKU</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-lg font-black">{w.units.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">ইউনিট</p>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">ধারণক্ষমতা ব্যবহার</span>
                <span className="font-bold">{w.capacity}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', w.capacity > 75 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${w.capacity}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" /> {w.lowStock}টি পণ্য কম স্টক
            </div>
          </div>
        ))}
      </div>

      {/* Transfer log */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">সাম্প্রতিক স্টক ট্রান্সফার</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-semibold">ট্রান্সফার</th>
                <th className="px-4 py-2.5 text-left font-semibold">পণ্য</th>
                <th className="px-4 py-2.5 text-left font-semibold">রুট</th>
                <th className="px-4 py-2.5 text-right font-semibold">পরিমাণ</th>
                <th className="px-4 py-2.5 text-center font-semibold">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {TRANSFER_LOG.map(t => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{t.id}<p className="text-[10px] text-muted-foreground font-sans">{t.date}</p></td>
                  <td className="px-4 py-3 text-xs">{t.product}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1">{t.from} <ChevronRight className="w-3 h-3 text-muted-foreground" /> {t.to}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{t.qty}</td>
                  <td className="px-4 py-3 text-center">
                    {t.status === 'completed'
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-green-700 bg-green-50"><CheckCircle2 className="w-3 h-3" /> সম্পন্ন</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-cyan-700 bg-cyan-50"><Truck className="w-3 h-3" /> পথে আছে</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">স্টক ট্রান্সফার তৈরি করুন</h3>
              <button onClick={() => setShowTransfer(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">পণ্য</label>
                <input placeholder="পণ্যের নাম বা SKU খুঁজুন" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">উৎস গুদাম</label>
                  <select className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {WAREHOUSES.map(w => <option key={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground mb-2.5" />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">গন্তব্য গুদাম</label>
                  <select className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {WAREHOUSES.slice().reverse().map(w => <option key={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">পরিমাণ</label>
                <input type="number" placeholder="ইউনিট সংখ্যা" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowTransfer(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted transition-colors">বাতিল</button>
              <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">ট্রান্সফার শুরু করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ 3. SMART COURIER ENGINE ============================ */

interface CourierScore {
  name: string;
  successRate: number;
  avgDays: number;
  rtoRate: number;
  costPerKg: number;
  coverage: string;
  color: string;
}

const COURIERS: CourierScore[] = [
  { name: 'Pathao',    successRate: 94, avgDays: 1.8, rtoRate: 6,  costPerKg: 70, coverage: 'সারাদেশ',       color: '#ef4444' },
  { name: 'Steadfast', successRate: 91, avgDays: 2.1, rtoRate: 9,  costPerKg: 65, coverage: 'সারাদেশ',       color: '#3b82f6' },
  { name: 'RedX',      successRate: 88, avgDays: 2.4, rtoRate: 12, costPerKg: 60, coverage: 'শহরকেন্দ্রিক',  color: '#f97316' },
  { name: 'Paperfly',  successRate: 86, avgDays: 2.8, rtoRate: 14, costPerKg: 58, coverage: 'সারাদেশ',       color: '#22c55e' },
];

interface ZoneRoute {
  zone: string;
  recommended: string;
  reason: string;
  altCourier: string;
}

const ZONE_ROUTES: ZoneRoute[] = [
  { zone: 'ঢাকা মেট্রো',   recommended: 'Pathao',    reason: 'দ্রুততম ডেলিভারি (১.৫ দিন) + সর্বোচ্চ সাকসেস', altCourier: 'RedX' },
  { zone: 'চট্টগ্রাম',     recommended: 'Steadfast', reason: 'এই জোনে ৯৩% সাকসেস রেট',                    altCourier: 'Pathao' },
  { zone: 'সিলেট',         recommended: 'Pathao',    reason: 'কম RTO হার (৫%)',                            altCourier: 'Paperfly' },
  { zone: 'রাজশাহী',       recommended: 'Paperfly',  reason: 'সর্বনিম্ন খরচ + ভালো কভারেজ',               altCourier: 'Steadfast' },
  { zone: 'খুলনা',         recommended: 'Steadfast', reason: 'নির্ভরযোগ্য গ্রামীণ কভারেজ',                 altCourier: 'RedX' },
  { zone: 'প্রত্যন্ত এলাকা', recommended: 'Paperfly', reason: 'একমাত্র পূর্ণ কভারেজ',                       altCourier: 'Steadfast' },
];

function SmartCourier() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">স্মার্ট কুরিয়ার ইঞ্জিন</h3>
          <p className="text-xs text-muted-foreground mt-0.5">প্রতিটি অর্ডারের ডেলিভারি জোন অনুযায়ী সাকসেস রেট, RTO ও খরচ বিশ্লেষণ করে সেরা কুরিয়ার সাজেস্ট করা হয়।</p>
        </div>
      </div>

      {/* Courier scorecards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COURIERS.map(c => (
          <div key={c.name} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm">{c.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.coverage}</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-black" style={{ color: c.color }}>{c.successRate}</span>
              <span className="text-sm font-bold text-muted-foreground mb-1">% সাকসেস</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full" style={{ width: `${c.successRate}%`, backgroundColor: c.color }} />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div><p className="text-sm font-black">{c.avgDays}</p><p className="text-[9px] text-muted-foreground">দিন</p></div>
              <div><p className="text-sm font-black text-amber-600">{c.rtoRate}%</p><p className="text-[9px] text-muted-foreground">RTO</p></div>
              <div><p className="text-sm font-black">৳{c.costPerKg}</p><p className="text-[9px] text-muted-foreground">/কেজি</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone → courier recommendation table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">জোন অনুযায়ী কুরিয়ার সুপারিশ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-semibold">ডেলিভারি জোন</th>
                <th className="px-4 py-2.5 text-left font-semibold">সুপারিশকৃত কুরিয়ার</th>
                <th className="px-4 py-2.5 text-left font-semibold">কারণ</th>
                <th className="px-4 py-2.5 text-left font-semibold">বিকল্প</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ZONE_ROUTES.map(z => (
                <tr key={z.zone} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-bold text-xs">{z.zone}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                      <Zap className="w-3 h-3" /> {z.recommended}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{z.reason}</td>
                  <td className="px-4 py-3 text-xs">{z.altCourier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================ 4. RTO TRACKER ============================ */

type RtoStage = 'returning' | 'received' | 'inspected' | 'restocked' | 'discarded';

const RTO_STAGE: Record<RtoStage, { label: string; color: string; bg: string; step: number }> = {
  returning:  { label: 'ফেরত আসছে',    color: 'text-amber-700',  bg: 'bg-amber-50',  step: 0 },
  received:   { label: 'গৃহীত',          color: 'text-blue-700',   bg: 'bg-blue-50',   step: 1 },
  inspected:  { label: 'পরিদর্শিত',     color: 'text-purple-700', bg: 'bg-purple-50', step: 2 },
  restocked:  { label: 'রিস্টক হয়েছে', color: 'text-green-700',  bg: 'bg-green-50',  step: 3 },
  discarded:  { label: 'বাতিল',          color: 'text-red-600',    bg: 'bg-red-50',    step: 3 },
};

const RTO_STEPS: RtoStage[] = ['returning', 'received', 'inspected', 'restocked'];

interface RtoParcel {
  id: string;
  orderId: string;
  product: string;
  courier: string;
  reason: string;
  stage: RtoStage;
  value: number;
  autoRestock: boolean;
}

const RTO_PARCELS: RtoParcel[] = [
  { id: 'RTO-321', orderId: 'ORD-5400', product: 'Python Programming — 3rd Ed.', courier: 'RedX',      reason: 'গ্রাহক ফোন ধরেননি',   stage: 'returning',  value: 1600, autoRestock: true },
  { id: 'RTO-320', orderId: 'ORD-5388', product: 'ক্লাস ৯-১০ বিজ্ঞান',          courier: 'Pathao',    reason: 'ভুল ঠিকানা',           stage: 'received',   value: 280,  autoRestock: true },
  { id: 'RTO-319', orderId: 'ORD-5370', product: 'English Grammar in Use',     courier: 'Steadfast', reason: 'গ্রাহক প্রত্যাখ্যান',  stage: 'inspected',  value: 650,  autoRestock: true },
  { id: 'RTO-318', orderId: 'ORD-5350', product: 'রবীন্দ্র রচনাবলী',          courier: 'Pathao',    reason: 'ক্যাশ ছিল না',         stage: 'restocked',  value: 1800, autoRestock: true },
  { id: 'RTO-317', orderId: 'ORD-5320', product: 'Data Structures Vol 1',     courier: 'Paperfly',  reason: 'পণ্য ক্ষতিগ্রস্ত',     stage: 'discarded',  value: 2100, autoRestock: false },
];

function RtoTracker() {
  const [autoRestock, setAutoRestock] = useState(true);

  const returning  = RTO_PARCELS.filter(p => p.stage === 'returning').length;
  const restocked  = RTO_PARCELS.filter(p => p.stage === 'restocked').length;
  const lostValue  = RTO_PARCELS.filter(p => p.stage === 'discarded').reduce((s, p) => s + p.value, 0);
  const recovered  = RTO_PARCELS.filter(p => p.stage === 'restocked').reduce((s, p) => s + p.value, 0);

  return (
    <div className="space-y-4">
      {/* KPIs + auto-restock toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: 'ফেরত আসছে',   value: returning,                  color: 'text-amber-600' },
            { label: 'রিস্টক হয়েছে', value: restocked,                  color: 'text-green-600' },
            { label: 'উদ্ধার মূল্য',  value: `৳${recovered.toLocaleString()}`, color: 'text-blue-600' },
            { label: 'ক্ষতি',         value: `৳${lostValue.toLocaleString()}`, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
              <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setAutoRestock(v => !v)}
          className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors',
            autoRestock ? 'bg-green-50 border-green-200 text-green-700' : 'bg-muted border-border text-muted-foreground')}>
          <RefreshCw className={cn('w-4 h-4', autoRestock && 'text-green-600')} />
          অটো-রিস্টক {autoRestock ? 'চালু' : 'বন্ধ'}
        </button>
      </div>

      {/* Parcel lifecycle cards */}
      <div className="space-y-3">
        {RTO_PARCELS.map(p => {
          const meta = RTO_STAGE[p.stage];
          const stepIdx = meta.step;
          const isDiscarded = p.stage === 'discarded';
          return (
            <div key={p.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm font-mono">{p.id}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', meta.color, meta.bg)}>{meta.label}</span>
                    {p.autoRestock && !isDiscarded && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">অটো-রিস্টক</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.product} · অর্ডার {p.orderId} · {p.courier}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">কারণ: {p.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black">৳{p.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">পণ্য মূল্য</p>
                </div>
              </div>
              {/* Lifecycle bar */}
              <div className="px-5 pb-4">
                {isDiscarded ? (
                  <div className="flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4" /> পণ্য ক্ষতিগ্রস্ত — রিস্টক করা যায়নি, বাতিল করা হয়েছে
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {RTO_STEPS.map((s, i) => (
                      <div key={s} className="flex-1">
                        <div className={cn('h-1.5 rounded-full transition-colors', i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
                        <p className={cn('text-[9px] mt-1 text-center', i <= stepIdx ? 'text-foreground font-bold' : 'text-muted-foreground')}>
                          {RTO_STAGE[s].label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ 5. OPS ANALYTICS ============================ */

const DELIVERY_TREND = [
  { d: 'সপ্তাহ ১', success: 88, rto: 12 },
  { d: 'সপ্তাহ ২', success: 90, rto: 10 },
  { d: 'সপ্তাহ ৩', success: 89, rto: 11 },
  { d: 'সপ্তাহ ৪', success: 92, rto: 8 },
  { d: 'সপ্তাহ ৫', success: 91, rto: 9 },
  { d: 'সপ্তাহ ৬', success: 94, rto: 6 },
];

const COURIER_PERF = COURIERS.map(c => ({ name: c.name, success: c.successRate, color: c.color }));

const LOGISTICS_COST = [
  { name: 'কুরিয়ার ফি', value: 142000, color: '#3b82f6' },
  { name: 'প্যাকেজিং', value: 38000, color: '#22c55e' },
  { name: 'RTO খরচ', value: 24000, color: '#f59e0b' },
  { name: 'গুদাম পরিচালন', value: 56000, color: '#a855f7' },
];

function OpsAnalytics() {
  const totalCost = LOGISTICS_COST.reduce((s, c) => s + c.value, 0);
  const avgSuccess = Math.round(DELIVERY_TREND.reduce((s, d) => s + d.success, 0) / DELIVERY_TREND.length);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'গড় সাকসেস রেট',   value: `${avgSuccess}%`,                 icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'মোট লজিস্টিকস খরচ', value: `৳${(totalCost/1000).toFixed(0)}K`, icon: DollarSign,   color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'গড় ডেলিভারি সময়',  value: '২.১ দিন',                       icon: Clock,        color: 'text-purple-600',bg: 'bg-purple-50' },
          { label: 'সামগ্রিক RTO হার',  value: '৯%',                            icon: RotateCcw,    color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Delivery success trend */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">ডেলিভারি সাকসেস বনাম RTO ট্রেন্ড</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={DELIVERY_TREND}>
              <defs>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rtoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Area type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} fill="url(#successGrad)" name="সাকসেস %" />
              <Area type="monotone" dataKey="rto" stroke="#f59e0b" strokeWidth={2} fill="url(#rtoGrad)" name="RTO %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Courier performance */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">কুরিয়ার পারফরম্যান্স তুলনা</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={COURIER_PERF} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={70} />
              <Tooltip />
              <Bar dataKey="success" radius={[0, 6, 6, 0]} name="সাকসেস রেট %">
                {COURIER_PERF.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logistics cost breakdown */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4">লজিস্টিকস খরচ বিভাজন</h3>
        <div className="grid sm:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={LOGISTICS_COST} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {LOGISTICS_COST.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {LOGISTICS_COST.map(c => {
              const pct = Math.round((c.value / totalCost) * 100);
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold">{c.name}</span>
                    </span>
                    <span className="font-black">৳{c.value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-sm font-bold">মোট মাসিক খরচ</span>
              <span className="text-base font-black text-primary">৳{totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ HUB SHELL ============================ */

export default function FulfillmentHubPage() {
  const [tab, setTab] = useState<ModuleTab>('cockpit');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Fulfillment & Operations Hub</h1>
        <p className="text-sm text-muted-foreground mt-0.5">সব চ্যানেলের অর্ডার, মাল্টি-গুদাম, স্মার্ট কুরিয়ার, RTO ও অপারেশন অ্যানালিটিক্স — এক জায়গায়</p>
      </div>

      {/* Module tabs */}
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] border-b pb-px">
        {MODULES.map(m => {
          const Icon = m.icon;
          const active = tab === m.id;
          return (
            <button key={m.id} onClick={() => setTab(m.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-colors',
                active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" /> {m.label}
            </button>
          );
        })}
      </div>

      {tab === 'cockpit'    && <OrderCockpit />}
      {tab === 'warehouses' && <MultiWarehouse />}
      {tab === 'courier'    && <SmartCourier />}
      {tab === 'rto'        && <RtoTracker />}
      {tab === 'analytics'  && <OpsAnalytics />}
    </div>
  );
}
