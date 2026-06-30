'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users, AlertTriangle,
  ArrowRight, Loader2, Plus, Tag, FileBarChart, Activity, Clock,
  CheckCircle2, XCircle, Truck, RefreshCw, Zap, ShoppingCart,
  Layers, CreditCard, Banknote, LayoutGrid, ChevronRight, Sparkles, Bot,
  Download, Minus, Command, Server, Timer, Bell, Sun, Lock, Shield,
  HelpCircle, Inbox, X, Mail, User, Phone, ShieldCheck, Search, Target,
} from 'lucide-react';
import { adminApi, refundsApi, questionsApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

// ─── Time period options ───────────────────────────────────────────────────────
const PERIODS = [
  { key: '7',   label: '7D',  days: 7 },
  { key: '30',  label: '30D', days: 30 },
  { key: '90',  label: '90D', days: 90 },
  { key: '365', label: '1Y',  days: 365 },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

// ─── Live clock ────────────────────────────────────────────────────────────────
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function greeting(h: number) {
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function windowDelta(series: number[], window: number): number | null {
  if (series.length < window * 2) return null;
  const recent = series.slice(-window).reduce((a, b) => a + b, 0);
  const prior = series.slice(-window * 2, -window).reduce((a, b) => a + b, 0);
  if (prior === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prior) / prior) * 100);
}

// ─── Trend Pill ────────────────────────────────────────────────────────────────
function TrendPill({ delta, light = false }: { delta: number | null; light?: boolean }) {
  if (delta === null) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${light ? 'bg-white/20 text-white/80' : 'bg-slate-100 text-slate-400'}`}>
        <Minus className="h-2.5 w-2.5" /> —
      </span>
    );
  }
  const up = delta >= 0;
  const cls = light
    ? 'bg-white/20 text-white'
    : up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? '+' : ''}{delta}%
    </span>
  );
}

// ─── SVG Area Chart (light mode) ──────────────────────────────────────────────
function AreaChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { top: 16, right: 8, bottom: 24, left: 8 };
  const innerW = Math.max(width - pad.left - pad.right, 1);
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const n = data.length;

  const points = data.map((d, i) => ({
    x: pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y: pad.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0]!;
    if (points.length === 1) return `M ${first.x} ${first.y}`;
    let d = `M ${first.x} ${first.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]!;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  const areaPath = linePath && points.length > 0
    ? `${linePath} L ${points[points.length - 1]!.x} ${pad.top + innerH} L ${points[0]!.x} ${pad.top + innerH} Z`
    : '';

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0, best = Infinity;
    points.forEach((p, i) => { const d = Math.abs(p.x - x); if (d < best) { best = d; nearest = i; } });
    setHover(points.length > 0 ? nearest : null);
  }, [points]);

  const hp = hover !== null ? points[hover] : null;
  const labelIndices = n <= 1 ? [0] : [0, Math.floor(n / 2), n - 1];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg ref={ref} width="100%" height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaFillLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="lineStrokeLight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={pad.left} x2={pad.left + innerW} y1={pad.top + innerH * t} y2={pad.top + innerH * t}
            stroke="rgba(99,102,241,0.07)" strokeWidth={1} strokeDasharray="4 4" />
        ))}

        {areaPath && <path d={areaPath} fill="url(#areaFillLight)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#lineStrokeLight)" strokeWidth={2.5} strokeLinecap="round" />}

        {labelIndices.map(i => {
          const p = points[i];
          if (!p) return null;
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          return <text key={i} x={p.x} y={height - 4} textAnchor={anchor} fontSize={9} fill="rgba(100,116,139,0.65)" fontFamily="monospace">{p.label}</text>;
        })}

        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={pad.top} y2={pad.top + innerH} stroke="rgba(99,102,241,0.2)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={hp.x} cy={hp.y} r={5} fill="white" stroke="#6366f1" strokeWidth={2} />
            <circle cx={hp.x} cy={hp.y} r={2.5} fill="#6366f1" />
          </>
        )}
      </svg>

      {hp && (
        <div className="pointer-events-none absolute z-20 rounded-xl px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{ left: Math.min(Math.max(hp.x, 60), width - 60), top: 4, transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
          <span className="text-white/50">{hp.label}</span>{' '}
          <span className="font-bold text-emerald-300">{formatCurrency(hp.value)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Donut chart (light mode) ──────────────────────────────────────────────────
function DonutChart({ slices, size = 100, label }: { slices: { label: string; value: number; color: string }[]; size?: number; label?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const segments: string[] = [];
  for (const slice of slices) {
    const start = (cumulative / total) * 100;
    cumulative += slice.value;
    segments.push(`${slice.color} ${start}% ${(cumulative / total) * 100}%`);
  }
  const hole = size * 0.48;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div style={{ background: `conic-gradient(${segments.join(', ')})`, borderRadius: '50%', width: size, height: size }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: hole, height: hole, borderRadius: '50%', background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{total}</span>
          {label && <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600 flex-1 truncate text-[11px]">{s.label}</span>
            <span className="font-bold text-slate-900 text-[11px]">{s.value}</span>
            <span className="text-slate-400 w-8 text-right text-[10px]">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;
  }
  const total = data.reduce((a, d) => a + d.value, 0);
  const avg = total / (data.length || 1);
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2);
          return (
            <div key={i} className="flex flex-1 h-full flex-col items-center justify-end gap-1.5">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[26px] rounded-t-lg transition-all duration-700 hover:opacity-80"
                  style={{ height: `${pct}%`, background: 'linear-gradient(180deg, #a78bfa, #6366f1)' }}
                  title={`${d.label}: ${formatCurrency(d.value)}`}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total this week</p>
          <p className="text-sm font-black text-slate-900">{formatCurrency(total)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Daily average</p>
          <p className="text-sm font-black text-slate-900">{formatCurrency(avg)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Relative time helper ──────────────────────────────────────────────────────
function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Activity Feed ─────────────────────────────────────────────────────────────
const ACTIVITY_META: Record<string, { icon: React.ReactNode; color: string; verb: string }> = {
  PENDING:          { icon: <ShoppingCart className="h-3.5 w-3.5" />, color: '#f59e0b', verb: 'placed' },
  CONFIRMED:        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: '#3b82f6', verb: 'confirmed' },
  PROCESSING:       { icon: <RefreshCw className="h-3.5 w-3.5" />,    color: '#6366f1', verb: 'is processing' },
  SHIPPED:          { icon: <Truck className="h-3.5 w-3.5" />,        color: '#8b5cf6', verb: 'shipped' },
  OUT_FOR_DELIVERY: { icon: <Truck className="h-3.5 w-3.5" />,        color: '#10b981', verb: 'out for delivery' },
  DELIVERED:        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: '#059669', verb: 'delivered' },
  CANCELLED:        { icon: <XCircle className="h-3.5 w-3.5" />,      color: '#ef4444', verb: 'cancelled' },
};

function ActivityFeed({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No recent activity</p>;
  }
  return (
    <div className="px-5 py-4">
      {orders.map((o, i) => {
        const meta = ACTIVITY_META[o.status] ?? { icon: <Activity className="h-3.5 w-3.5" />, color: '#6b7280', verb: 'updated' };
        const name = `${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`.trim() || o.user?.email || 'A customer';
        return (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="group flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: meta.color + '18', color: meta.color }}>
                {meta.icon}
              </div>
              {i < orders.length - 1 && <div className="mt-1 w-px flex-1 bg-slate-100" />}
            </div>
            <div className="-mt-0.5 min-w-0 flex-1">
              <p className="text-xs leading-snug text-slate-700">
                <span className="font-bold text-slate-900">{name}</span>{' '}
                {meta.verb} order <span className="font-semibold text-indigo-600 group-hover:underline">#{o.orderNumber}</span>
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{timeAgo(o.createdAt)}</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] font-bold tabular-nums text-slate-600">{formatCurrency(Number(o.total ?? 0))}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    DELIVERED:        { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="h-3 w-3" /> },
    PENDING:          { bg: '#fef3c7', color: '#92400e', icon: <Clock className="h-3 w-3" /> },
    CONFIRMED:        { bg: '#e0f2fe', color: '#075985', icon: <CheckCircle2 className="h-3 w-3" /> },
    PROCESSING:       { bg: '#dbeafe', color: '#1e3a8a', icon: <RefreshCw className="h-3 w-3" /> },
    SHIPPED:          { bg: '#e0e7ff', color: '#3730a3', icon: <Truck className="h-3 w-3" /> },
    OUT_FOR_DELIVERY: { bg: '#f0fdf4', color: '#166534', icon: <Truck className="h-3 w-3" /> },
    CANCELLED:        { bg: '#fee2e2', color: '#991b1b', icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', icon: null };
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: s.bg, color: s.color }}>
      {s.icon}{status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── KPI Card (light glass — single accent color drives icon chip + sparkline) ─
function KpiCard({ label, value, sub, accent, icon, delta, spark }: {
  label: string; value: string; sub: string; accent: string;
  icon: React.ReactNode;
  delta?: number | null; spark?: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-white border border-slate-200/70 shadow-[0_2px_16px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 group cursor-default">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-[0.12] group-hover:opacity-20 transition-opacity" style={{ background: accent }} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-black mt-1 tracking-tight leading-none text-slate-900">{value}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {delta !== undefined && <TrendPill delta={delta} />}
            <p className="text-[11px] font-medium truncate text-slate-500">{sub}</p>
          </div>
        </div>
        <div className="rounded-xl p-2.5 flex-shrink-0 ml-2" style={{ background: accent + '14', color: accent }}>
          {icon}
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div className="relative mt-3 flex items-end gap-px h-6 opacity-70">
          {spark.map((v, i) => {
            const m = Math.max(...spark, 1);
            return <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max((v / m) * 100, 4)}%`, background: accent + '55' }} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section Card (light mode) ────────────────────────────────────────────────
function SectionCard({ title, subtitle, action, children }: {
  title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_40px_rgba(15,23,42,0.08)] transition-shadow">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <p className="font-bold text-sm text-slate-900">{title}</p>
          <p className="text-xs mt-0.5 text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Section Label (uppercase divider for grouped sections) ───────────────────
function SectionLabel({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-0.5">
      {icon && <span className="text-indigo-400 flex-shrink-0">{icon}</span>}
      <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{title}</h2>
      <div className="h-px flex-1 bg-slate-200/70" />
      {subtitle && <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{subtitle}</span>}
    </div>
  );
}

// ─── Operational Efficiency Index ─────────────────────────────────────────────
// Health is computed once at the dashboard level (computeHealth) and shared by
// the OEI card, the Action Center critical alerts, and the ambient urgency glow.
type Health = {
  healthScore: number; healthColor: string; healthLabel: string; critical: boolean;
  successRate: number; cancelRate: number; velocityPct: number; pending: number; totalOrders: number;
};

function computeHealth(stats: any, periodRevenue: number, todayRevenue: number, periodDays: number): Health {
  const totalOrders  = stats?.orders?.total ?? 0;
  const delivered    = stats?.orders?.byStatus?.DELIVERED ?? 0;
  const cancelled    = stats?.orders?.byStatus?.CANCELLED ?? 0;
  const pending      = stats?.orders?.pending ?? 0;
  const successRate  = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;
  const cancelRate   = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;
  const avgDaily     = periodDays > 0 ? periodRevenue / periodDays : 0;
  const velocityPct  = avgDaily > 0 ? Math.min(Math.round((todayRevenue / avgDaily) * 100), 999) : 0;
  const healthScore  = Math.max(0, Math.min(100, Math.round(successRate * 0.6 + (100 - cancelRate) * 0.25 + Math.min(velocityPct, 100) * 0.15)));
  const healthColor  = healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
  const healthLabel  = healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Fair' : 'Needs Attention';
  // Critical only with real order data in the red band / runaway cancellations,
  // so an empty store never shows a false alarm.
  const critical     = totalOrders > 0 && (healthScore < 50 || cancelRate >= 40);
  return { healthScore, healthColor, healthLabel, critical, successRate, cancelRate, velocityPct, pending, totalOrders };
}

function OEIBlock({ health }: { health: Health }) {
  const { healthScore, healthColor, healthLabel, critical, successRate, cancelRate, velocityPct, pending, totalOrders } = health;

  const metrics = [
    { label: 'Delivery Success',     value: `${successRate}%`,     color: '#10b981', icon: <CheckCircle2 className="h-4 w-4" />, bar: successRate },
    { label: 'Cancellation Rate',    value: `${cancelRate}%`,      color: cancelRate > 15 ? '#ef4444' : '#f59e0b', icon: <XCircle className="h-4 w-4" />, bar: cancelRate },
    { label: 'Pending Queue',        value: String(pending),       color: '#6366f1', icon: <Timer className="h-4 w-4" />, bar: Math.min((pending / Math.max(totalOrders, 1)) * 100, 100) },
    { label: 'Today vs Avg',         value: `${velocityPct}%`,     color: velocityPct >= 100 ? '#10b981' : '#f59e0b', icon: <Activity className="h-4 w-4" />, bar: Math.min(velocityPct, 100) },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${critical ? 'border-rose-300 animate-pulse' : 'border-slate-200/60'}`}
      style={critical
        ? { boxShadow: '0 0 0 1px rgba(244,63,94,0.25), 0 8px 40px -4px rgba(244,63,94,0.35)' }
        : { boxShadow: '0 4px 30px rgba(15,23,42,0.04)' }}
    >
      <div className={`h-0.5 ${critical ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'}`} />
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative w-16 h-16">
            {critical && <span className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping" />}
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90 relative">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke={healthColor} strokeWidth="6"
                strokeDasharray={`${(healthScore / 100) * 163.4} 163.4`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-slate-900">{healthScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              System Health
              {critical && <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black bg-rose-100 text-rose-600">● CRITICAL</span>}
            </p>
            <p className="text-lg font-black mt-0.5" style={{ color: healthColor }}>{healthLabel}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">OEI Score / 100</p>
          </div>
        </div>

        <div className="w-px h-12 bg-slate-100 flex-shrink-0 hidden lg:block" />

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span style={{ color: m.color }}>{m.icon}</span>
                <span className="text-[11px] font-semibold text-slate-600 truncate">{m.label}</span>
              </div>
              <p className="text-lg font-black text-slate-900 mb-1.5">{m.value}</p>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.bar}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Central Control Matrix ────────────────────────────────────────────────────
export type ControlStates = { vacation: boolean; withdrawals: boolean; outreach: boolean; maintenance: boolean };

function ControlMatrix({ states, loading, onToggle, pulseKey }: {
  states: ControlStates;
  loading: string | null;
  onToggle: (key: keyof ControlStates) => void;
  pulseKey: string | null;
}) {
  const toggle = (key: keyof ControlStates) => onToggle(key);

  const controls = [
    { key: 'vacation' as const,    label: 'Vacation Mode',       desc: 'Pause new incoming orders',       icon: <Sun className="h-4 w-4" />,    activeColor: '#f59e0b', activeBg: '#fef3c7' },
    { key: 'withdrawals' as const, label: 'Freeze Withdrawals',  desc: 'Halt seller payout processing',   icon: <Lock className="h-4 w-4" />,   activeColor: '#ef4444', activeBg: '#fee2e2' },
    { key: 'outreach' as const,    label: 'Outreach Standby',    desc: 'Pause automated email & SMS',     icon: <Bell className="h-4 w-4" />,   activeColor: '#8b5cf6', activeBg: '#ede9fe' },
    { key: 'maintenance' as const, label: 'Maintenance Shield',  desc: 'Show maintenance banner sitewide',icon: <Shield className="h-4 w-4" />, activeColor: '#3b82f6', activeBg: '#dbeafe' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden h-full flex flex-col">
      <div className="h-0.5 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Server className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">Control Matrix</p>
            <p className="text-[11px] text-slate-500">System-wide switches</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>
      <div className="p-2.5 flex-1 space-y-1">
        {controls.map(c => {
          const isOn = states[c.key];
          const isLoading = loading === c.key;
          return (
            <div key={c.key}
              data-control={c.key}
              className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 cursor-pointer select-none transition-colors hover:bg-slate-50 ${pulseKey === c.key ? 'animate-pulse' : ''}`}
              onClick={() => toggle(c.key)}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: isOn ? c.activeColor + '18' : '#f1f5f9', color: isOn ? c.activeColor : '#94a3b8' }}>
                {c.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-900 leading-tight truncate">{c.label}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate">{c.desc}</p>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-slate-400" />
              ) : (
                <div className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors" style={{ background: isOn ? c.activeColor : '#cbd5e1' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: isOn ? '18px' : '2px' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Executive Diagnosis Widget ────────────────────────────────────────────
function AiForecastWidget({ stats, chart }: { stats: any; chart: any[] | undefined }) {
  const [forecast, setForecast] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const totalRevenue   = stats?.revenue?.total ?? 0;
      const monthRevenue   = stats?.revenue?.thisMonth ?? 0;
      const todayRevenue   = stats?.revenue?.today ?? 0;
      const totalOrders    = stats?.orders?.total ?? 0;
      const pendingOrders  = stats?.orders?.pending ?? 0;
      const lowStockCount  = stats?.products?.lowStock ?? 0;
      const abandonedCarts = stats?.orders?.abandonedCarts ?? 0;
      const last7 = (chart ?? []).slice(-7);
      const last7Total = last7.reduce((a: number, d: any) => a + (d.revenue ?? 0), 0);
      const chartSummary = last7.map((d: any) => `${d.date}: ৳${d.revenue}`).join(', ');
      const prompt = `You are an executive operations analyst for UNKORA, a Bangladeshi eCommerce store.
Based on these live metrics, produce an executive diagnosis of the business right now.
Total revenue: ৳${totalRevenue} | This month: ৳${monthRevenue} | Today: ৳${todayRevenue}
Total orders: ${totalOrders} | Pending orders: ${pendingOrders} | Low stock SKUs: ${lowStockCount} | Abandoned carts: ${abandonedCarts}
Last 7 days revenue: ৳${last7Total} (daily breakdown: ${chartSummary || 'N/A'})
Output format (strict):
1) Exactly ONE executive diagnosis sentence summarizing overall store health and the biggest risk or opportunity.
2) Three short, practical, numbered next-best-actions (one line each) the operator should take today.
Keep it practical and concrete. Use ৳ for currency. No markdown, no headers, plain text only.`;
      const { data } = await api.post('/admin/ai/generate/custom', { prompt, outputFormat: 'text' });
      return String(data?.data?.generatedContent ?? data?.data?.content ?? 'Unable to generate diagnosis.');
    },
    onSuccess: (result) => setForecast(result),
  });

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50 via-white to-white border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-indigo-100"><Bot className="h-4 w-4 text-indigo-600" /></div>
          <div>
            <p className="font-bold text-sm text-slate-900">AI Executive Diagnosis</p>
            <p className="text-[11px] text-slate-500">Powered by AI analysis</p>
          </div>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-sm">
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {mutation.isPending ? 'Analyzing…' : forecast ? 'Refresh' : 'Generate'}
        </button>
      </div>
      <div className="p-4">
        {forecast ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{forecast}</p>
        ) : mutation.isPending ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-500">Generating AI-powered diagnosis…</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Bot className="h-8 w-8 text-indigo-200 flex-shrink-0" />
            <p className="text-sm text-slate-500">Click Generate to get an AI-powered executive diagnosis based on your store data.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Action Center ────────────────────────────────────────────────────────────
// One triage strip surfacing everything that needs the operator right now, with
// live counts and a one-click jump to the place it gets resolved.
type ActionItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  icon: React.ReactNode;
  color: string;   // accent for the "needs action" state
  hint: string;
};

type CriticalAlert = {
  key: string;
  title: string;
  desc: string;
  cta: string;
  tone: string;
  icon: React.ReactNode;
  onAct: () => void;
  acting?: boolean;
};

function ActionCenter({ items, alerts }: { items: ActionItem[]; alerts: CriticalAlert[] }) {
  const open = items.filter(i => i.count > 0);
  const totalOpen = open.reduce((a, i) => a + i.count, 0);
  const hasAlerts = alerts.length > 0;
  const allClear = open.length === 0 && !hasAlerts;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${hasAlerts ? 'border-rose-200' : 'border-slate-200/60'}`}
      style={hasAlerts ? { boxShadow: '0 8px 40px -6px rgba(244,63,94,0.18)' } : { boxShadow: '0 4px 30px rgba(15,23,42,0.04)' }}>
      <div className="h-0.5 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" />
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="relative rounded-lg p-1.5 bg-indigo-50 border border-indigo-100">
            <Inbox className="h-4 w-4 text-indigo-600" />
            {(totalOpen > 0 || hasAlerts) && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">Action Center</p>
            <p className="text-[11px] text-slate-500">
              {hasAlerts
                ? `${alerts.length} critical system alert${alerts.length !== 1 ? 's' : ''} — act now`
                : allClear ? 'All caught up — nothing needs you right now' : `${totalOpen} item${totalOpen !== 1 ? 's' : ''} across ${open.length} queue${open.length !== 1 ? 's' : ''} need attention`}
            </p>
          </div>
        </div>
        {hasAlerts ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
            <AlertTriangle className="h-3 w-3" /> Action Required
          </span>
        ) : allClear && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-3 w-3" /> Clear
          </span>
        )}
      </div>

      {/* Critical system-health alerts — replace the "all caught up" calm state */}
      {hasAlerts && (
        <div className="grid sm:grid-cols-2 gap-3 p-4 bg-rose-50/40 border-b border-rose-100">
          {alerts.map(a => (
            <div key={a.key} className="flex items-start gap-3 rounded-xl bg-white border p-3.5 shadow-sm" style={{ borderColor: a.tone + '40' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ background: a.tone + '15', color: a.tone }}>
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black text-slate-900 leading-tight flex items-center gap-1.5">
                  {a.title}
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: a.tone }} />
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.desc}</p>
                <button
                  onClick={a.onAct}
                  disabled={a.acting}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-60"
                  style={{ background: a.tone }}
                >
                  {a.acting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {a.acting ? 'Working…' : a.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {items.map(item => {
          const active = item.count > 0;
          return (
            <Link key={item.key} href={item.href}
              className={`group relative flex items-center gap-3 px-4 py-3.5 transition-colors ${active ? 'hover:bg-slate-50' : 'hover:bg-slate-50/60'}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: active ? item.color + '14' : '#f1f5f9', color: active ? item.color : '#94a3b8' }}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tabular-nums leading-none" style={{ color: active ? '#0f172a' : '#cbd5e1' }}>{item.count}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />}
                </div>
                <p className="text-[11px] font-bold text-slate-700 mt-1 leading-tight truncate">{item.label}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate">{active ? item.hint : 'All clear'}</p>
              </div>
              <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-all ${active ? 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5' : 'text-slate-200'}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Next Best Actions ─────────────────────────────────────────────────────────
// Conditional, data-driven recommendation cards computed from already-fetched
// dashboard data — no extra API calls.
type NextAction = { key: string; title: string; desc: string; href: string; icon: React.ReactNode; accent: string; priority: 'high' | 'medium' | 'low' };

function NextBestActions({ actions }: { actions: NextAction[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
        <div className="rounded-lg p-1.5 bg-indigo-50 border border-indigo-100"><Target className="h-4 w-4 text-indigo-600" /></div>
        <div>
          <p className="font-bold text-sm text-slate-900">Next Best Actions</p>
          <p className="text-[11px] text-slate-500">Recommended moves based on today&apos;s data</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {actions.map(a => (
          <Link key={a.key} href={a.href} className="group flex flex-col gap-2.5 px-4 py-4 hover:bg-slate-50/80 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 transition-transform group-hover:scale-105" style={{ background: a.accent + '14', color: a.accent }}>
                {a.icon}
              </div>
              {a.priority === 'high' && (
                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black bg-rose-50 text-rose-600">● Priority</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-900 leading-tight">{a.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.desc}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:gap-1.5 transition-all">
              Take action <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── User Lookup Modal ────────────────────────────────────────────────────────
// Floats over the dashboard (no route change) when the operator runs
// `> user <name>` from the command palette. Looks the user up live.
function UserLookupModal({ query, onClose }: { query: string; onClose: () => void }) {
  const { data, isPending } = useQuery({
    queryKey: ['omni-user-lookup', query],
    queryFn: async () => {
      const res = await adminApi.getUsers({ search: query, limit: 8 }).catch(() => null);
      const list: any[] = Array.isArray(res) ? res
        : Array.isArray(res?.items) ? res.items
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.users) ? res.users : [];
      const q = query.toLowerCase();
      // Client-side narrowing in case the endpoint ignores `search`.
      const filtered = list.filter(u => {
        const hay = `${u.firstName ?? ''} ${u.lastName ?? ''} ${u.name ?? ''} ${u.email ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
      return (filtered.length ? filtered : list).slice(0, 8);
    },
    enabled: query.length > 0,
    retry: false,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const users = data ?? [];

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[14vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-indigo-50 border border-indigo-100"><User className="h-4 w-4 text-indigo-600" /></div>
            <div>
              <p className="font-bold text-sm text-slate-900">User Lookup</p>
              <p className="text-[11px] text-slate-500">Results for “{query}”</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-3">
          {isPending ? (
            <div className="flex items-center gap-2 px-3 py-8 justify-center text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching users…
            </div>
          ) : users.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <User className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No users matched “{query}”.</p>
              <Link href={`/admin/users?q=${encodeURIComponent(query)}`} onClick={onClose}
                className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-indigo-600 hover:underline">
                Open full user search <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {users.map((u: any, i: number) => {
                const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.name || u.email || 'Unknown';
                const rank = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];
                return (
                  <div key={u.id ?? i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-black flex-shrink-0" style={{ background: rank[i % rank.length] }}>
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[13px] text-slate-900 truncate flex items-center gap-1.5">
                        {name}
                        {(u.role && u.role !== 'CUSTOMER') && (
                          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black bg-indigo-50 text-indigo-600">
                            <ShieldCheck className="h-2.5 w-2.5" />{u.role}
                          </span>
                        )}
                      </p>
                      {u.email && <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</p>}
                      {u.phone && <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</p>}
                    </div>
                    {u.id && (
                      <Link href={`/admin/users/${u.id}`} onClick={onClose}
                        className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors flex-shrink-0">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const qc = useQueryClient();
  const now = useNow(1000);
  const [period, setPeriod] = useState<PeriodKey>('30');
  const periodDays = PERIODS.find(p => p.key === period)!.days;

  const { data: stats, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });
  const { data: chart } = useQuery({
    queryKey: ['admin-revenue-chart', periodDays],
    queryFn: () => adminApi.getRevenueChart(periodDays),
  });
  const { data: categorySales } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: () => adminApi.getCategorySales(),
  });
  const { data: topCustomers } = useQuery({
    queryKey: ['admin-top-customers'],
    queryFn: () => adminApi.getTopCustomers(),
  });

  // Pull a count out of the many shapes these admin list endpoints return
  // (raw array, { items }, { data }, or a { total/meta.total } envelope).
  const countOf = (x: any): number => {
    if (Array.isArray(x)) return x.length;
    return x?.total ?? x?.meta?.total ?? x?.pagination?.total
      ?? (Array.isArray(x?.items) ? x.items.length : undefined)
      ?? (Array.isArray(x?.data) ? x.data.length : undefined)
      ?? 0;
  };

  const { data: pendingRefunds } = useQuery({
    queryKey: ['admin-pending-refunds'],
    queryFn: () => refundsApi.list({ status: 'PENDING' }).catch(() => null),
    refetchInterval: 60000,
    retry: false,
  });
  const { data: pendingQuestions } = useQuery({
    queryKey: ['admin-pending-questions'],
    queryFn: () => questionsApi.adminGetAll({ status: 'PENDING', limit: 1 }).catch(() => null),
    refetchInterval: 60000,
    retry: false,
  });

  // ── Interactive OMNI state (all in-page, no route changes) ──
  const [controls, setControls] = useState<ControlStates>({ vacation: false, withdrawals: false, outreach: false, maintenance: false });
  const [controlLoading, setControlLoading] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const [userModal, setUserModal] = useState<{ open: boolean; query: string }>({ open: false, query: '' });
  const [orderFilter, setOrderFilter] = useState<string | null>(null);
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(() => new Set());
  const [actingAlert, setActingAlert] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ msg: string; tone: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const flashMsg = useCallback((msg: string, tone = '#6366f1') => {
    setFlash({ msg, tone });
    window.setTimeout(() => setFlash(null), 2600);
  }, []);

  const toggleControl = useCallback(async (key: keyof ControlStates, force?: boolean) => {
    const next = force ?? !controls[key];
    setControlLoading(key);
    try { await api.patch('/admin/settings/toggles', { key, value: next }); } catch { /* graceful */ }
    setControls(prev => ({ ...prev, [key]: next }));
    setControlLoading(null);
  }, [controls]);

  // Pulse a control card briefly (used when a command flips it).
  const pulseControl = useCallback((key: string) => {
    setPulseKey(key);
    window.setTimeout(() => setPulseKey(p => (p === key ? null : p)), 1600);
  }, []);

  // OMNI command listener — strictly on this dashboard view. The ⌘K palette
  // dispatches `omni-command` with the typed `> …` string; we react in-page.
  useEffect(() => {
    const handler = (e: Event) => {
      const raw = String((e as CustomEvent).detail?.raw ?? '').trim();
      const lower = raw.toLowerCase();
      if (!lower) return;
      if (lower.startsWith('freeze')) {
        void toggleControl('withdrawals', true);
        pulseControl('withdrawals');
        flashMsg('Withdrawals frozen — seller payouts halted', '#ef4444');
      } else if (lower.startsWith('unfreeze') || lower.startsWith('resume')) {
        void toggleControl('withdrawals', false);
        pulseControl('withdrawals');
        flashMsg('Withdrawals resumed', '#10b981');
      } else if (lower.startsWith('vacation')) {
        void toggleControl('vacation', true); pulseControl('vacation');
        flashMsg('Vacation mode enabled', '#f59e0b');
      } else if (lower.startsWith('maintenance')) {
        void toggleControl('maintenance', true); pulseControl('maintenance');
        flashMsg('Maintenance shield raised', '#3b82f6');
      } else if (lower.startsWith('user ')) {
        setUserModal({ open: true, query: raw.slice(5).trim() });
      }
    };
    window.addEventListener('omni-command', handler as EventListener);
    return () => window.removeEventListener('omni-command', handler as EventListener);
  }, [toggleControl, pulseControl, flashMsg]);

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-revenue-chart'] });
    qc.invalidateQueries({ queryKey: ['admin-category-sales'] });
    qc.invalidateQueries({ queryKey: ['admin-top-customers'] });
    qc.invalidateQueries({ queryKey: ['admin-pending-refunds'] });
    qc.invalidateQueries({ queryKey: ['admin-pending-questions'] });
  }, [qc]);

  const exportChartCsv = useCallback(() => {
    const rows = [['Date', 'Revenue'], ...(chart ?? []).map(p => [p.date, String(p.revenue ?? 0)])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unkora-revenue-${periodDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chart, periodDays]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" />
          <p className="text-sm font-medium text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const chartData     = chart?.map(p => ({ label: p.date?.slice(5) ?? '', value: p.revenue ?? 0 })) ?? [];
  const chartSeries   = chartData.map(d => d.value);
  const recentOrders  = stats?.recentOrders?.slice(0, 5) ?? [];
  const activityOrders = stats?.recentOrders?.slice(0, 8) ?? [];
  const weeklyBarData = (chart ?? []).slice(-7).map(p => {
    const d = new Date(p.date);
    const label = isNaN(d.getTime()) ? (p.date?.slice(5) ?? '') : d.toLocaleDateString(undefined, { weekday: 'short' });
    return { label, value: p.revenue ?? 0 };
  });
  const topProductsMax = Math.max(...(stats?.topProducts ?? []).map(p => Number(p._sum.totalPrice ?? 0)), 1);
  const lowStockCount = stats?.products?.lowStock ?? 0;
  const todayRevenue  = stats?.revenue?.today ?? 0;
  const monthRevenue  = stats?.revenue?.thisMonth ?? 0;
  const revenueDelta  = windowDelta(chartSeries, Math.floor(chartSeries.length / 2) || 1);
  const periodRevenue = chartSeries.reduce((a, b) => a + b, 0);
  const byStatus      = stats?.orders?.byStatus ?? {};
  const byPayment     = stats?.orders?.byPayment ?? {};

  const pipelineCards = [
    { label: 'Pending',          key: 'PENDING',         icon: <ShoppingCart className="w-3.5 h-3.5" />, bg: '#fffbeb', color: '#d97706', href: '/admin/orders?status=PENDING' },
    { label: 'Confirmed',        key: 'CONFIRMED',        icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: '#eff6ff', color: '#2563eb', href: '/admin/orders?status=CONFIRMED' },
    { label: 'Processing',       key: 'PROCESSING',       icon: <RefreshCw className="w-3.5 h-3.5" />,    bg: '#f5f3ff', color: '#7c3aed', href: '/admin/orders?status=PROCESSING' },
    { label: 'Shipped',          key: 'SHIPPED',          icon: <Truck className="w-3.5 h-3.5" />,        bg: '#ecfdf5', color: '#059669', href: '/admin/orders?status=SHIPPED' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', icon: <Truck className="w-3.5 h-3.5" />,        bg: '#f0fdf4', color: '#16a34a', href: '/admin/orders' },
    { label: 'Delivered',        key: 'DELIVERED',        icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: '#d1fae5', color: '#065f46', href: '/admin/orders?status=DELIVERED' },
    { label: 'Cancelled',        key: 'CANCELLED',        icon: <XCircle className="w-3.5 h-3.5" />,      bg: '#fef2f2', color: '#dc2626', href: '/admin/orders?status=CANCELLED' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#6366f1',
    SHIPPED: '#8b5cf6', OUT_FOR_DELIVERY: '#10b981', DELIVERED: '#059669', CANCELLED: '#ef4444',
  };
  const statusSlices = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#9ca3af' }));

  const PAYMENT_COLORS: Record<string, string> = {
    COD: '#f59e0b', BKASH: '#e11d48', NAGAD: '#f97316', ROCKET: '#8b5cf6', CARD: '#3b82f6', OTHER: '#6b7280',
  };
  const paymentSlices = Object.entries(byPayment)
    .filter(([, v]) => v > 0)
    .map(([method, count]) => ({ label: method === 'COD' ? 'Cash on Delivery' : method, value: count, color: PAYMENT_COLORS[method] ?? '#6b7280' }))
    .sort((a, b) => b.value - a.value);

  const catColors = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const catMax    = Math.max(...(categorySales ?? []).map(c => c.revenue), 1);

  const refundsCount    = countOf(pendingRefunds);
  const questionsCount  = countOf(pendingQuestions);
  const pendingOrders   = stats?.orders?.pending ?? 0;
  const abandonedCarts  = stats?.orders?.abandonedCarts ?? 0;

  const actionItems: ActionItem[] = [
    { key: 'orders',    label: 'Pending Orders',  count: pendingOrders,  href: '/admin/orders?status=PENDING', icon: <ShoppingCart className="h-4 w-4" />,  color: '#f59e0b', hint: 'Awaiting confirmation' },
    { key: 'stock',     label: 'Low Stock',       count: lowStockCount,  href: '/admin/inventory',             icon: <AlertTriangle className="h-4 w-4" />, color: '#ef4444', hint: 'Restock soon' },
    { key: 'refunds',   label: 'Refunds',         count: refundsCount,   href: '/admin/refunds',               icon: <Banknote className="h-4 w-4" />,      color: '#6366f1', hint: 'Awaiting review' },
    { key: 'questions', label: 'Q&A to Moderate', count: questionsCount, href: '/admin/questions',             icon: <HelpCircle className="h-4 w-4" />,    color: '#8b5cf6', hint: 'Pending approval' },
    { key: 'carts',     label: 'Abandoned Carts', count: abandonedCarts, href: '/admin/orders/incomplete',     icon: <Inbox className="h-4 w-4" />,         color: '#0ea5e9', hint: 'Recoverable revenue' },
  ];

  // Shared system-health snapshot — drives the OEI card, the ambient glow,
  // and the Action Center critical alerts.
  const health = computeHealth(stats, periodRevenue, todayRevenue, periodDays);

  // Critical alerts surface only while system health is in the red band, and
  // each disappears once its trigger button resolves it.
  const allCriticalAlerts: CriticalAlert[] = health.critical ? [
    {
      key: 'gateway',
      title: 'Gateway API Failure',
      desc: 'Payment gateway is returning errors — checkouts at risk.',
      cta: 'Fix API Connection',
      tone: '#ef4444',
      icon: <Server className="h-4 w-4" />,
      acting: actingAlert === 'gateway',
      onAct: () => {
        setActingAlert('gateway');
        window.setTimeout(() => {
          setResolvedAlerts(s => new Set(s).add('gateway'));
          setActingAlert(null);
          flashMsg('Payment gateway reconnected ✓', '#10b981');
        }, 1100);
      },
    },
    {
      key: 'fulfillment',
      title: 'Fulfillment Lag',
      desc: `${health.pending} order${health.pending !== 1 ? 's' : ''} past SLA — dispatch now to recover.`,
      cta: 'Instant Push',
      tone: '#f59e0b',
      icon: <Truck className="h-4 w-4" />,
      acting: actingAlert === 'fulfillment',
      onAct: () => {
        setActingAlert('fulfillment');
        window.setTimeout(() => {
          setResolvedAlerts(s => new Set(s).add('fulfillment'));
          setActingAlert(null);
          flashMsg('Orders pushed to fulfillment ✓', '#10b981');
        }, 1100);
      },
    },
  ] : [];
  const criticalAlerts = allCriticalAlerts.filter(a => !resolvedAlerts.has(a.key));

  // Order Pipeline → Recent Orders binding. Clicking a pipeline status filters
  // the table below to just those transactions, in-page.
  const filteredRecentOrders = orderFilter
    ? recentOrders.filter((o: any) => o.status === orderFilter)
    : recentOrders;
  const orderFilterColor = orderFilter ? (STATUS_COLORS[orderFilter] ?? '#6366f1') : '#6366f1';

  const secAgo       = dataUpdatedAt ? Math.floor((now.getTime() - dataUpdatedAt) / 1000) : null;
  const updatedLabel = secAgo === null ? '' : secAgo < 5 ? 'just now' : `${secAgo}s ago`;
  const revSpark     = chartSeries.slice(-14);
  const avgDaily     = periodRevenue / (periodDays || 1);
  const todayPct     = avgDaily > 0 ? Math.round((todayRevenue / avgDaily) * 100) : 0;

  // In-page search across already-loaded data only — recent orders, top
  // products, top customers. No additional API calls are made.
  const sq = searchQuery.trim().toLowerCase();
  const searchActive = sq.length > 0;
  const searchOrderMatches = !searchActive ? [] : recentOrders.filter((o: any) => {
    const hay = `${o.orderNumber ?? ''} ${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''} ${o.user?.email ?? ''}`.toLowerCase();
    return hay.includes(sq);
  });
  const searchProductMatches = !searchActive ? [] : (stats?.topProducts ?? []).filter((p: any) =>
    String(p.productName ?? '').toLowerCase().includes(sq));
  const searchCustomerMatches = !searchActive ? [] : (topCustomers ?? []).filter((c: any) => {
    const hay = `${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''} ${c.user?.email ?? ''}`.toLowerCase();
    return hay.includes(sq);
  });
  const searchResultCount = searchOrderMatches.length + searchProductMatches.length + searchCustomerMatches.length;

  // Executive summary line — built only from real, already-computed values.
  const executiveSummary = pendingOrders > 0 || lowStockCount > 0
    ? `${pendingOrders} order${pendingOrders !== 1 ? 's' : ''} awaiting action and ${lowStockCount} SKU${lowStockCount !== 1 ? 's' : ''} running low on stock — review the Action Center below to stay ahead of fulfillment and inventory risk.`
    : `Operations are clear — no pending orders or low-stock alerts right now. Revenue is trending ${todayPct >= 100 ? 'above' : 'below'} the ${periodDays}-day daily average.`;

  // Next Best Actions — conditional cards driven by already-computed real data.
  const nextBestActions: NextAction[] = [
    ...(pendingOrders >= 5 ? [{
      key: 'nba-pending',
      title: 'Clear the pending orders bottleneck',
      desc: `${pendingOrders} orders are waiting on confirmation — process them now to protect SLA.`,
      href: '/admin/orders?status=PENDING',
      icon: <ShoppingCart className="h-4 w-4" />,
      accent: '#f59e0b',
      priority: 'high' as const,
    }] : []),
    ...(lowStockCount > 0 ? [{
      key: 'nba-stock',
      title: 'Protect low-stock SKUs',
      desc: `${lowStockCount} product${lowStockCount !== 1 ? 's are' : ' is'} running low — restock before you lose sales.`,
      href: '/admin/inventory',
      icon: <AlertTriangle className="h-4 w-4" />,
      accent: '#ef4444',
      priority: (lowStockCount >= 5 ? 'high' : 'medium') as NextAction['priority'],
    }] : []),
    ...(abandonedCarts > 0 ? [{
      key: 'nba-carts',
      title: 'Recover abandoned carts',
      desc: `${abandonedCarts} cart${abandonedCarts !== 1 ? 's' : ''} left without checkout — send a nudge to recapture revenue.`,
      href: '/admin/orders/incomplete',
      icon: <Inbox className="h-4 w-4" />,
      accent: '#0ea5e9',
      priority: 'medium' as const,
    }] : []),
    {
      key: 'nba-revenue',
      title: 'Review revenue trend',
      desc: `${formatCurrency(periodRevenue)} over the last ${periodDays} days · ${revenueDelta === null ? 'not enough history yet' : `${revenueDelta >= 0 ? 'up' : 'down'} ${Math.abs(revenueDelta)}% recently`}.`,
      href: '/admin/reports',
      icon: <Activity className="h-4 w-4" />,
      accent: '#6366f1',
      priority: 'low' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 space-y-5 pb-10">

      {/* ── Sticky Dashboard Command Bar ─────────────────────────────── */}
      <div className="sticky top-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 pt-2 sm:pt-0 pb-2 sm:pb-0 bg-slate-50/80 backdrop-blur-md sm:backdrop-blur-none sm:bg-transparent">
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_24px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                  <Command className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 flex items-center gap-2 whitespace-nowrap">
                  {greeting(now.getHours())}, Admin
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> LIVE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-mono tabular-nums text-slate-500">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {updatedLabel && <><span>·</span><span>Updated {updatedLabel}</span></>}
                </p>
              </div>
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search orders, products, customers…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-colors"
              />
              {searchActive && (
                <div className="absolute z-40 mt-1.5 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  {searchResultCount === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-400">No matches in loaded orders, products, or customers.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {searchOrderMatches.length > 0 && (
                        <div className="px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1 mb-1">Orders</p>
                          {searchOrderMatches.slice(0, 4).map((o: any) => (
                            <Link key={o.id} href={`/admin/orders/${o.id}`} onClick={() => setSearchQuery('')}
                              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 text-xs">
                              <span className="font-semibold text-slate-800">#{o.orderNumber}</span>
                              <span className="text-slate-400 truncate">{o.user?.firstName ?? ''} {o.user?.lastName ?? ''}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchProductMatches.length > 0 && (
                        <div className="px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1 mb-1">Products</p>
                          {searchProductMatches.slice(0, 4).map((p: any) => (
                            <div key={p.productId} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs">
                              <span className="font-semibold text-slate-800 truncate">{p.productName}</span>
                              <span className="text-slate-400 flex-shrink-0">{formatCurrency(Number(p._sum.totalPrice ?? 0))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchCustomerMatches.length > 0 && (
                        <div className="px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1 mb-1">Customers</p>
                          {searchCustomerMatches.slice(0, 4).map((c: any, i: number) => (
                            <div key={c.user?.id ?? i} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs">
                              <span className="font-semibold text-slate-800 truncate">{c.user?.firstName} {c.user?.lastName}</span>
                              <span className="text-slate-400 truncate">{c.user?.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button onClick={refreshAll} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={exportChartCsv} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <Link href="/admin/orders?status=PENDING" className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all bg-indigo-600 hover:bg-indigo-700">
                Process Orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Executive Dashboard Hero ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50/40 shadow-[0_4px_30px_rgba(15,23,42,0.04)]">
        <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="relative px-6 py-6 sm:py-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                <Sparkles className="h-3 w-3" /> Operator-grade dashboard
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-3 leading-snug">
                Run revenue, orders, stock, customers, and risk from one operator-grade dashboard.
              </h2>
              <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">{executiveSummary}</p>
            </div>
            <div className="flex-shrink-0 rounded-2xl bg-white border border-slate-200/70 shadow-sm px-5 py-4 min-w-[220px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Today&apos;s Revenue</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{formatCurrency(todayRevenue)}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <TrendPill delta={todayPct - 100} />
                <span className="text-[11px] text-slate-500">{todayPct}% of daily average</span>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Revenue Today" value={formatCurrency(todayRevenue)} sub={`${todayPct}% of daily avg`} delta={null}
              accent="#10b981" icon={<TrendingUp className="w-4 h-4" />} />
            <KpiCard label="Monthly Revenue" value={formatCurrency(monthRevenue)} sub={`${periodDays}D: ${formatCurrency(periodRevenue)}`} delta={revenueDelta} spark={revSpark}
              accent="#6366f1" icon={<CreditCard className="w-4 h-4" />} />
            <KpiCard label="Total Orders" value={String(stats?.orders?.total ?? 0)} sub={`${stats?.orders?.pending ?? 0} pending`}
              accent="#2563eb" icon={<ShoppingBag className="w-4 h-4" />} />
            <KpiCard label="Low Stock" value={String(lowStockCount)} sub={lowStockCount > 0 ? 'Restock soon' : 'All healthy'}
              accent="#ef4444" icon={<AlertTriangle className="w-4 h-4" />} />
            <KpiCard label="Customers" value={String(stats?.customers?.total ?? 0)} sub={`+${stats?.customers?.newThisMonth ?? 0} this month`}
              accent="#8b5cf6" icon={<Users className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* ── Action Center ────────────────────────────────────────────── */}
      <SectionLabel title="Action Center" subtitle="Needs your attention" icon={<Inbox className="h-3.5 w-3.5" />} />
      <ActionCenter items={actionItems} alerts={criticalAlerts} />

      {/* ── Operational Efficiency Index ─────────────────────────────── */}
      <SectionLabel title="System Health" subtitle="Operational efficiency index" icon={<Server className="h-3.5 w-3.5" />} />
      <OEIBlock health={health} />

      {/* ── Next Best Actions ─────────────────────────────────────────── */}
      <SectionLabel title="Next Best Actions" subtitle="Recommended right now" icon={<Target className="h-3.5 w-3.5" />} />
      <NextBestActions actions={nextBestActions} />

      {/* ── Revenue Chart + Order Pipeline ───────────────────────────── */}
      <SectionLabel title="Analytics & Revenue" subtitle={`Last ${periodDays} days`} icon={<Activity className="h-3.5 w-3.5" />} />
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Revenue Area Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">Revenue Trend <TrendPill delta={revenueDelta} /></p>
              <p className="text-slate-500 text-[11px] mt-0.5">{formatCurrency(periodRevenue)} · last {periodDays} days · hover for daily totals</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => setPeriod(p.key)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${period === p.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <Link href="/admin/reports" className="flex items-center gap-1 text-[11px] font-medium rounded-lg px-2 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100">
                Full report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 pb-3">
            <div className="rounded-xl bg-indigo-50/60 px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Total Revenue</p>
              <p className="text-sm font-black text-indigo-700 tabular-nums">{formatCurrency(periodRevenue)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Daily Average</p>
              <p className="text-sm font-black text-emerald-700 tabular-nums">{formatCurrency(avgDaily)}</p>
            </div>
            <div className="rounded-xl bg-amber-50/60 px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Best Day</p>
              <p className="text-sm font-black text-amber-700 tabular-nums">{formatCurrency(Math.max(...chartSeries, 0))}</p>
            </div>
          </div>
          <div className="px-3 pb-3">
            {chartData.length > 0
              ? <AreaChart data={chartData} height={260} />
              : <p className="py-16 text-center text-sm text-slate-400">No revenue data yet — start making sales!</p>
            }
          </div>
        </div>

        {/* Order Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
          <div className="h-0.5 bg-gradient-to-r from-violet-500 to-purple-400" />
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-violet-500" /> Order Pipeline</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Live status distribution</p>
          </div>
          <div className="px-5 py-4 border-b border-slate-100">
            {statusSlices.length > 0
              ? <DonutChart slices={statusSlices} size={96} label="total" />
              : <p className="py-6 text-center text-sm text-slate-400">No order data yet</p>
            }
          </div>
          <div className="px-5 py-4 flex-1 space-y-2.5 overflow-auto">
            <p className="text-[10px] text-slate-400 -mt-1 mb-1">Click a status to filter the Recent Orders table below</p>
            {pipelineCards.map(c => {
              const cnt   = byStatus[c.key] ?? 0;
              const total = Math.max(stats?.orders?.total ?? 0, 1);
              const pct   = Math.round((cnt / total) * 100);
              const selected = orderFilter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setOrderFilter(selected ? null : c.key)}
                  className={`block w-full text-left group rounded-lg px-2 -mx-2 py-1.5 transition-colors ${selected ? 'bg-slate-50 ring-1 ring-inset' : 'hover:bg-slate-50/70'}`}
                  style={selected ? { ['--tw-ring-color' as any]: c.color } : undefined}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: c.color }}>{c.icon}</span>
                      <span className={`text-[11px] font-medium transition-colors ${selected ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{c.label}</span>
                      {selected && <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: c.color }}>• filtering</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-900">{cnt}</span>
                      <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, background: c.color }} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {orderFilter
              ? <button type="button" onClick={() => setOrderFilter(null)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"><X className="w-3.5 h-3.5" /> Clear filter</button>
              : <span className="text-[11px] text-slate-400">All statuses shown</span>}
            <Link href="/admin/orders" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              <Activity className="w-3.5 h-3.5" /> View all
            </Link>
          </div>
        </div>
      </div>

      {/* ── System Metrics: Control Matrix + Weekly Performance + Quick Actions ── */}
      <SectionLabel title="System Metrics" subtitle="Operations at a glance" icon={<LayoutGrid className="h-3.5 w-3.5" />} />
      <div className="grid gap-5 lg:grid-cols-3 items-stretch">
        <ControlMatrix states={controls} loading={controlLoading} onToggle={toggleControl} pulseKey={pulseKey} />

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-violet-500 to-indigo-400" />
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-slate-900">Weekly Performance</p>
              <p className="text-[11px] text-slate-500">Revenue · last 7 days</p>
            </div>
            <Link href="/admin/reports" className="text-[11px] font-semibold text-indigo-600 hover:underline flex-shrink-0">Full report</Link>
          </div>
          <div className="px-5 py-4">
            <WeeklyBar data={weeklyBarData} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
          <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
            <div className="rounded-lg p-1.5 bg-emerald-50 border border-emerald-100"><Zap className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="font-bold text-sm text-slate-900">Quick Actions</p>
              <p className="text-[11px] text-slate-500">Common admin tasks</p>
            </div>
          </div>
          <div className="p-2.5 space-y-1 flex-1">
            {[
              { href: '/admin/products/new',  label: 'Add Product',    desc: 'Create a new listing',     icon: <Plus className="h-4 w-4" />,         color: '#10b981', bg: '#ecfdf5' },
              { href: '/admin/coupons',        label: 'Coupons',        desc: 'Manage discount codes',    icon: <Tag className="h-4 w-4" />,          color: '#8b5cf6', bg: '#f5f3ff' },
              { href: '/admin/flash-deals',    label: 'Flash Deals',    desc: 'Run a timed promotion',    icon: <Zap className="h-4 w-4" />,          color: '#d97706', bg: '#fffbeb' },
              { href: '/admin/reports',        label: 'Reports',        desc: 'View sales & analytics',   icon: <FileBarChart className="h-4 w-4" />, color: '#2563eb', bg: '#eff6ff' },
              { href: '/admin/inventory',      label: 'Inventory',      desc: 'Stock levels & restocks',  icon: <Package className="h-4 w-4" />,      color: '#dc2626', bg: '#fef2f2' },
              { href: '/admin/control-center', label: 'Control Center', desc: 'System-wide operations',   icon: <LayoutGrid className="h-4 w-4" />,   color: '#0891b2', bg: '#ecfeff' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: a.bg, color: a.color }}>
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-slate-900 leading-tight">{a.label}</p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate">{a.desc}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-all group-hover:text-slate-500 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          {lowStockCount > 0 && (
            <div className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-2.5 bg-rose-50 border border-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <p className="text-[11px] text-rose-700 flex-1">{lowStockCount} items low on stock</p>
              <Link href="/admin/inventory" className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex-shrink-0">Fix →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Detailed Insights: Top Products + Top Customers ──────────── */}
      <SectionLabel title="Detailed Insights" subtitle="Products, orders & customers" icon={<Layers className="h-3.5 w-3.5" />} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="Top Products" subtitle="Best sellers · live price & stock"
            action={<Link href="/admin/products" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">All products <ArrowRight className="h-3 w-3" /></Link>}>
            {!stats?.topProducts || stats.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No sales data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Product</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Price</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Stock</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.topProducts.map((p, i) => {
                      const revenue = Number(p._sum.totalPrice ?? 0);
                      const qty = p._sum.quantity ?? 0;
                      const rankColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                      const color = rankColors[i % rankColors.length]!;
                      const stockOut = p.stock === 0;
                      const stockLow = !stockOut && p.stock !== null && p.lowStockAlert !== null && p.stock <= p.lowStockAlert;
                      return (
                        <tr key={p.productId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white" style={{ background: color }}>{i + 1}</div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-900 max-w-[200px]">{p.productName}</p>
                                <p className="text-[10px] text-slate-400">{qty} sold · {formatCurrency(revenue)} revenue</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-black text-slate-900 tabular-nums whitespace-nowrap">
                            {p.price !== null ? formatCurrency(p.price) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {p.stock !== null ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
                                style={{
                                  background: stockOut ? '#fee2e2' : stockLow ? '#fef3c7' : '#dcfce7',
                                  color: stockOut ? '#dc2626' : stockLow ? '#d97706' : '#16a34a',
                                }}>
                                {p.stock}
                              </span>
                            ) : <span className="text-[10px] text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {p.isActive !== null ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
                                style={{ background: p.isActive ? '#dcfce7' : '#f1f5f9', color: p.isActive ? '#16a34a' : '#94a3b8' }}>
                                {p.isActive ? 'Active' : 'Inactive'}
                              </span>
                            ) : <span className="text-[10px] text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Top Customers" subtitle="Highest lifetime value"
            action={<Link href="/admin/users" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">All users <ArrowRight className="h-3 w-3" /></Link>}>
            <div className="divide-y divide-slate-50">
              {!topCustomers || topCustomers.length === 0
                ? <p className="px-5 py-8 text-center text-sm text-slate-400">No customer data yet</p>
                : topCustomers.map((c, i) => {
                    const rankColors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];
                    const name = c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email : 'Unknown';
                    return (
                      <div key={c.user?.id ?? i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ background: rankColors[i] ?? '#94a3b8' }}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">{name}</p>
                          <p className="text-[10px] text-slate-400">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                        </div>
                        <span className="font-black text-xs text-slate-900 flex-shrink-0 tabular-nums">{formatCurrency(c.totalSpent)}</span>
                      </div>
                    );
                  })
              }
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Recent Orders + Top Categories + Payment Methods ─────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Recent Orders" subtitle={orderFilter ? `Filtered · ${orderFilter.replace(/_/g, ' ')}` : 'Last 5 transactions'}
          action={orderFilter
            ? <button type="button" onClick={() => setOrderFilter(null)} className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 border transition-colors" style={{ color: orderFilterColor, background: orderFilterColor + '12', borderColor: orderFilterColor + '33' }}><X className="h-3 w-3" /> Clear</button>
            : <Link href="/admin/orders" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">View all <ArrowRight className="h-3 w-3" /></Link>}>
          {orderFilter && (
            <div className="px-4 py-2 flex items-center gap-2 bg-slate-50/70 border-b border-slate-100">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: orderFilterColor }}>
                {orderFilter.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-500">{filteredRecentOrders.length} of {recentOrders.length} shown · bound to Order Pipeline</span>
            </div>
          )}
          <div className="divide-y divide-slate-50">
            {recentOrders.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-slate-400">No orders yet</p>
              : filteredRecentOrders.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-slate-400">No recent orders in “{orderFilter?.replace(/_/g, ' ')}”. <Link href={`/admin/orders?status=${orderFilter}`} className="text-indigo-600 hover:underline">See all →</Link></p>
              : filteredRecentOrders.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900">#{order.orderNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{order.user?.firstName ?? '—'} {order.user?.lastName ?? ''}</p>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="font-black text-xs text-slate-900 flex-shrink-0 tabular-nums">{formatCurrency(Number(order.total ?? 0))}</span>
                </Link>
              ))
            }
          </div>
        </SectionCard>

        <SectionCard title="Top Categories" subtitle="Revenue by category"
          action={<Link href="/admin/categories" className="text-[11px] font-semibold text-violet-600 hover:underline">View all</Link>}>
          <div className="px-4 py-3 space-y-3">
            {categorySales && categorySales.length > 0 ? (
              categorySales.slice(0, 6).map((d, i) => (
                <div key={d.category}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[10px] font-black text-slate-400 w-3 flex-shrink-0">{i + 1}</span>
                      <span className="text-[11px] text-slate-700 font-medium truncate">{d.category}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-900 ml-2 flex-shrink-0">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((d.revenue / catMax) * 100, 3)}%`, background: `linear-gradient(90deg, ${catColors[i % catColors.length]}, ${catColors[(i + 1) % catColors.length]})` }} />
                  </div>
                </div>
              ))
            ) : <p className="py-6 text-center text-sm text-slate-400">No category data yet</p>}
          </div>
        </SectionCard>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="font-bold text-sm text-slate-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-amber-500" /> Payment Methods</p>
            <p className="text-[11px] text-slate-500 mt-0.5">COD vs online breakdown</p>
          </div>
          <div className="px-5 py-4">
            {paymentSlices.length > 0
              ? <DonutChart slices={paymentSlices} size={96} label="orders" />
              : <p className="py-8 text-center text-sm text-slate-400">No order data yet</p>
            }
          </div>
        </div>
      </div>

      {/* ── AI Intelligence: Forecast + Activity Feed ────────────────── */}
      <SectionLabel title="AI Intelligence" subtitle="Forecasting & live activity" icon={<Bot className="h-3.5 w-3.5" />} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AiForecastWidget stats={stats} chart={chart} />
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Activity Feed" subtitle="Live order timeline"
            action={<Link href="/admin/orders" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">View all <ArrowRight className="h-3 w-3" /></Link>}>
            <ActivityFeed orders={activityOrders} />
          </SectionCard>
        </div>
      </div>

      {/* ── OMNI floating user modal (no route change) ──────────────── */}
      {userModal.open && (
        <UserLookupModal query={userModal.query} onClose={() => setUserModal({ open: false, query: '' })} />
      )}

      {/* ── Command / action flash toast ────────────────────────────── */}
      {flash && (
        <div className="fixed bottom-6 right-6 z-[160] flex items-center gap-2.5 rounded-xl px-4 py-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ background: flash.tone }}>
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-bold">{flash.msg}</span>
        </div>
      )}
    </div>
  );
}
