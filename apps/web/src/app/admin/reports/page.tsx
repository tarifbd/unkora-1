'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CreditCard,
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCw,
  Star,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

// ─── Live clock hook ───────────────────────────────────────────────────────────
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ─── Trend helper: % change of recent window vs prior window ───────────────────
function windowDelta(series: number[], window: number): number | null {
  if (window < 1 || series.length < window * 2) return null;
  const recent = series.slice(-window).reduce((a, b) => a + b, 0);
  const prior = series.slice(-window * 2, -window).reduce((a, b) => a + b, 0);
  if (prior === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prior) / prior) * 100);
}

// ─── Trend pill ────────────────────────────────────────────────────────────────
function TrendPill({ delta, light = false }: { delta: number | null; light?: boolean }) {
  if (delta === null) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${light ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-400'}`}>
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

// ─── Interactive SVG area chart (gradient + crosshair tooltip) ────────────────
function RevenueAreaChart({
  data,
  height = 240,
  peakLabel,
}: {
  data: { label: string; value: number }[];
  height?: number;
  peakLabel?: string;
}) {
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

  const pad = { top: 18, right: 12, bottom: 26, left: 12 };
  const w = width;
  const h = height;
  const innerW = Math.max(w - pad.left - pad.right, 1);
  const innerH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const n = data.length;

  const points = data.map((d, i) => ({
    x: pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y: pad.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const peakIdx = useMemo(() => {
    let best = 0;
    data.forEach((d, i) => { if (d.value > (data[best]?.value ?? 0)) best = i; });
    return best;
  }, [data]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0]!;
    if (points.length === 1) return `M ${first.x} ${first.y}`;
    let dd = `M ${first.x} ${first.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]!;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      dd += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return dd;
  }, [points]);

  const areaPath = linePath && points.length > 0
    ? `${linePath} L ${points[points.length - 1]!.x} ${pad.top + innerH} L ${points[0]!.x} ${pad.top + innerH} Z`
    : '';

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < best) { best = dist; nearest = i; }
    });
    setHover(points.length > 0 ? nearest : null);
  }, [points]);

  const hp = hover !== null ? points[hover] : null;
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const peakPt = points[peakIdx];

  return (
    <div className="relative w-full" style={{ height: h }}>
      <svg
        ref={ref}
        width="100%"
        height={h}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="repAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="repLineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t}
            x1={pad.left} x2={pad.left + innerW}
            y1={pad.top + innerH * t} y2={pad.top + innerH * t}
            stroke="#eef2f7" strokeWidth={1} strokeDasharray={t === 1 ? undefined : '4 4'} />
        ))}

        {areaPath && <path d={areaPath} fill="url(#repAreaFill)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#repLineStroke)" strokeWidth={2.5} strokeLinecap="round" />}

        {/* Peak day annotation */}
        {peakPt && data.length > 1 && (
          <>
            <line x1={peakPt.x} x2={peakPt.x} y1={pad.top} y2={pad.top + innerH}
              stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <circle cx={peakPt.x} cy={peakPt.y} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
          </>
        )}

        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={pad.top} y2={pad.top + innerH} stroke="#c7d2fe" strokeWidth={1} />
            <circle cx={hp.x} cy={hp.y} r={6} fill="#6366f1" opacity={0.2} />
            <circle cx={hp.x} cy={hp.y} r={3.5} fill="#4f46e5" stroke="#fff" strokeWidth={1.5} />
          </>
        )}

        {points.map((p, i) => (
          i % labelEvery === 0 ? (
            <text key={i} x={p.x} y={h - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{p.label}</text>
          ) : null
        ))}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{
            left: Math.min(Math.max(hp.x, 60), w - 60),
            top: -4,
            transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
          }}
        >
          <span className="text-white/50">{hp.label}</span>{' '}
          <span className="font-bold text-emerald-300">{formatCurrency(hp.value)}</span>
        </div>
      )}

      {peakPt && !hp && peakLabel && (
        <div
          className="pointer-events-none absolute z-10 rounded-md px-2 py-1 text-[10px] font-bold whitespace-nowrap"
          style={{
            left: Math.min(Math.max(peakPt.x, 40), w - 40),
            top: Math.max(peakPt.y - 28, 2),
            transform: 'translateX(-50%)',
            background: '#f59e0b',
            color: '#fff',
          }}
        >
          Peak: {peakLabel}
        </div>
      )}
    </div>
  );
}

// ─── Section header with gradient accent ─────────────────────────────────────
function SectionHeader({
  icon,
  title,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="rounded-xl p-2.5 text-white flex-shrink-0" style={{ background: gradient }}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-black text-gray-800 tracking-tight">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1 self-center ml-2">
        <div className="h-px" style={{
          background: `linear-gradient(90deg, ${gradient.includes('emerald') ? '#10b981' : gradient.includes('blue') ? '#3b82f6' : gradient.includes('purple') ? '#8b5cf6' : gradient.includes('orange') ? '#f59e0b' : '#6366f1'}, transparent)`,
        }} />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  trend,
  gradient,
  icon,
  delta,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'neutral';
  gradient: string;
  icon: React.ReactNode;
  delta?: number | null;
}) {
  return (
    <div
      className="rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="text-2xl font-black mt-1.5 tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-2">
            {delta !== undefined && delta !== null && <TrendPill delta={delta} light />}
            <p className="text-xs opacity-75 font-medium truncate">{sub}</p>
          </div>
        </div>
        <div
          className="rounded-xl p-2.5 flex-shrink-0 ml-3"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Order status progress bar ────────────────────────────────────────────────
function StatusProgressBar({
  status,
  count,
  total,
  color,
  icon,
}: {
  status: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700">{status}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-800">{count}</span>
            <span
              className="text-xs font-semibold rounded-full px-2 py-0.5"
              style={{ background: `${color}15`, color }}
            >
              {pct}%
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(pct, 1)}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const colors = ['#f59e0b', '#94a3b8', '#cd7f32', '#6366f1', '#10b981'];
  const bg = colors[rank - 1] ?? '#9ca3af';
  return (
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
      style={{ background: bg }}
    >
      {rank}
    </div>
  );
}

// ─── Stars display ────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className="h-3 w-3"
          style={{ color: n <= rating ? '#f59e0b' : '#e5e7eb', fill: n <= rating ? '#f59e0b' : 'none' }}
        />
      ))}
    </div>
  );
}

// ─── Date range tabs ─────────────────────────────────────────────────────────
const DATE_RANGES = ['Today', '7D', '30D', '90D', '1Y'] as const;
type DateRange = (typeof DATE_RANGES)[number];

function DateRangeTabs({ value, onChange, light = false }: {
  value: DateRange;
  onChange: (v: DateRange) => void;
  light?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: light ? 'rgba(255,255,255,0.12)' : '#f1f5f9' }}
    >
      {DATE_RANGES.map(r => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          style={
            value === r
              ? light
                ? { background: 'rgba(255,255,255,0.95)', color: '#4f46e5', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { background: '#6366f1', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }
              : { color: light ? 'rgba(255,255,255,0.75)' : '#6b7280' }
          }
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Toast (errors only) ─────────────────────────────────────────────────────
function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  function showToast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }
  return { message, showToast };
}

// ─── Status icon/color map ────────────────────────────────────────────────────
const STATUS_META: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING:    { color: '#f59e0b', icon: <Clock className="h-4 w-4" /> },
  CONFIRMED:  { color: '#3b82f6', icon: <CheckCircle2 className="h-4 w-4" /> },
  PROCESSING: { color: '#6366f1', icon: <RefreshCw className="h-4 w-4" /> },
  SHIPPED:    { color: '#8b5cf6', icon: <Truck className="h-4 w-4" /> },
  DELIVERED:  { color: '#10b981', icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED:  { color: '#ef4444', icon: <XCircle className="h-4 w-4" /> },
};

// ─── Range slice map ──────────────────────────────────────────────────────────
const RANGE_DAYS: Record<DateRange, number> = {
  Today: 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};

/* ══════════════════════════════════════════════════════════════════
   Analytics Center — main page
══════════════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const { message: toastMsg, showToast } = useToast();
  const now = useNow(1000);
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue-chart', 30],
    queryFn: () => adminApi.getRevenueChart(30),
  });

  const { data: ordersByStatus, isLoading: ordersStatusLoading } = useQuery({
    queryKey: ['admin-orders-by-status'],
    queryFn: () => adminApi.getOrdersByStatus(),
  });

  const { data: categorySales, isLoading: catLoading } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: () => adminApi.getCategorySales(),
  });

  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-top-customers'],
    queryFn: () => adminApi.getTopCustomers(),
  });

  const isLoading = statsLoading || chartLoading;

  // ── Export functions ─────────────────────────────────────────────────────────
  function exportCsv() {
    try {
      const lines: string[] = [];
      lines.push('UNKORA — Reports & Analytics Export');
      lines.push(`Generated,${new Date().toISOString()}`);
      lines.push(`Date range,${dateRange}`);
      lines.push('');
      lines.push('REVENUE SUMMARY');
      lines.push('Metric,Value');
      lines.push(`Today,${stats?.revenue.today ?? 0}`);
      lines.push(`This Month,${stats?.revenue.thisMonth ?? 0}`);
      lines.push(`All Time,${stats?.revenue.total ?? 0}`);
      lines.push(`Avg Order Value,${Math.round(avgOrderValue)}`);
      lines.push('');
      lines.push('DAILY REVENUE');
      lines.push('Date,Revenue');
      (chart ?? []).forEach(p => lines.push(`${p.date},${p.revenue}`));
      lines.push('');
      lines.push('ORDERS BY STATUS');
      lines.push('Status,Count');
      (ordersByStatus ?? []).forEach(s => lines.push(`${s.status},${s.count}`));
      lines.push('');
      lines.push('CATEGORY SALES');
      lines.push('Category,Revenue');
      (categorySales ?? []).forEach(c => lines.push(`${c.category},${c.revenue}`));
      lines.push('');
      lines.push('TOP CUSTOMERS');
      lines.push('Customer,Orders,Total Spent');
      (topCustomers ?? []).forEach(c => {
        const name = c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email : 'Unknown';
        lines.push(`"${name}",${c.orderCount},${c.totalSpent}`);
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unkora-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed — please try again.');
    }
  }

  function exportOrdersCsv() {
    try {
      const lines: string[] = [];
      lines.push('UNKORA — Orders Report');
      lines.push(`Generated,${new Date().toISOString()}`);
      lines.push('');
      lines.push('Status,Count');
      (ordersByStatus ?? []).forEach(s => lines.push(`${s.status},${s.count}`));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unkora-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed — please try again.');
    }
  }

  function exportPdf() {
    setTimeout(() => window.print(), 300);
  }

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-revenue-chart'] });
    qc.invalidateQueries({ queryKey: ['admin-orders-by-status'] });
    qc.invalidateQueries({ queryKey: ['admin-category-sales'] });
    qc.invalidateQueries({ queryKey: ['admin-top-customers'] });
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#6366f1' }} />
          <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  // ── Derived metrics ───────────────────────────────────────────────────────────
  const chartData = chart?.map(p => ({ label: p.date.slice(5), value: p.revenue })) ?? [];
  const rangeSlice = RANGE_DAYS[dateRange];
  const filteredChartData = chartData.slice(-rangeSlice);
  const filteredRevenue = filteredChartData.reduce((s, p) => s + p.value, 0);
  const filteredSeries = filteredChartData.map(p => p.value);
  const halfWindow = Math.floor(filteredSeries.length / 2) || 1;
  const revenueDelta = windowDelta(filteredSeries, halfWindow);
  const peakDay = filteredChartData.reduce(
    (best, p) => (p.value > (best?.value ?? -1) ? p : best),
    filteredChartData[0],
  );
  const avgDaily = filteredSeries.length ? filteredRevenue / filteredSeries.length : 0;

  const totalOrders = stats?.orders.total ?? 0;
  const last30Revenue = chartData.reduce((s, p) => s + p.value, 0);
  const avgOrderValue = totalOrders > 0 ? last30Revenue / totalOrders : 0;
  const totalCustomers = stats?.customers.total ?? 0;

  const totalOrdersAllStatuses = (ordersByStatus ?? []).reduce((s, x) => s + x.count, 0);
  const deliveredCount = (ordersByStatus ?? []).find(s => s.status === 'DELIVERED')?.count ?? 0;

  const maxCatRevenue = Math.max(...(categorySales?.map(c => c.revenue) ?? [0]), 1);

  const CAT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6 pb-12 relative">
      {/* ── Error toast ── */}
      {toastMsg && (
        <div
          className="fixed top-6 right-6 z-50 rounded-2xl px-5 py-3 text-white shadow-2xl font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          {toastMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PREMIUM GRADIENT HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl px-7 py-6 print:rounded-none"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-14 h-52 w-52 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-8 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 top-0 h-24 w-24 rounded-full bg-pink-400/10 blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Top row: title + live clock + actions */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">Analytics Center</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30 print:hidden">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-400 inline-block" />
                  Live
                </span>
              </div>
              <p className="text-sm text-white/60">
                {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}
                <span className="tabular-nums font-medium text-white/80">
                  {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
              <button
                type="button"
                onClick={refreshAll}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={exportOrdersCsv}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Download className="h-3.5 w-3.5" /> Orders CSV
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <FileText className="h-3.5 w-3.5" /> PDF/Print
              </button>
            </div>
          </div>

          {/* Date range tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Range</span>
            <DateRangeTabs value={dateRange} onChange={setDateRange} light />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4 KPI STAT CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(filteredRevenue)}
          sub="vs prior period"
          gradient="linear-gradient(135deg, #10b981, #059669)"
          icon={<DollarSign className="h-5 w-5" />}
          delta={revenueDelta}
        />
        <StatCard
          label="Total Orders"
          value={String(totalOrders)}
          sub={`${stats?.orders.pending ?? 0} pending`}
          gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
          icon={<ShoppingBag className="h-5 w-5" />}
          delta={null}
        />
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          sub={`${stats?.customers.newThisMonth ?? 0} new this month`}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          icon={<Users className="h-5 w-5" />}
          delta={null}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          sub="per completed order"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          icon={<CreditCard className="h-5 w-5" />}
          delta={null}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HERO REVENUE CHART (full-width)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4" />}
              title="Revenue Trend"
              subtitle="Daily revenue — hover for details, gold dot marks peak day"
              gradient="linear-gradient(135deg, #10b981, #059669)"
            />
          </div>
        </div>

        {/* Trend + insight chips */}
        {filteredChartData.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <TrendPill delta={revenueDelta} />
              <span className="text-xs font-semibold text-gray-500">Period vs Prior</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mr-2">Peak Day</span>
              <span className="text-sm font-black text-gray-800">{peakDay?.label ?? '—'}</span>
              <span className="text-xs text-emerald-600 font-semibold ml-1.5">{formatCurrency(peakDay?.value ?? 0)}</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mr-2">Avg/Day</span>
              <span className="text-sm font-black text-gray-800">{formatCurrency(Math.round(avgDaily))}</span>
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-4"
          style={{ background: 'linear-gradient(135deg, #fafafa, #f8fafc)', border: '1px solid #e5e7eb' }}
        >
          {chartLoading ? (
            <div className="flex items-center justify-center" style={{ height: 240 }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : filteredChartData.length > 0 ? (
            <RevenueAreaChart
              data={filteredChartData}
              height={240}
              peakLabel={peakDay ? `${peakDay.label} · ${formatCurrency(peakDay.value)}` : undefined}
            />
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">No chart data for this range</p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3-COLUMN BOTTOM: Order Status | Category Sales | Top Customers
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Col 1: ORDER STATUS ── */}
        <section className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6">
          <SectionHeader
            icon={<ShoppingBag className="h-4 w-4" />}
            title="Order Status"
            subtitle="Live order distribution"
            gradient="linear-gradient(135deg, #3b82f6, #4f46e5)"
          />
          {ordersStatusLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : !ordersByStatus || ordersByStatus.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No order data</p>
          ) : (
            <div className="space-y-4">
              {ordersByStatus.map(item => {
                const meta = STATUS_META[item.status] ?? { color: '#9ca3af', icon: <ShoppingBag className="h-4 w-4" /> };
                return (
                  <StatusProgressBar
                    key={item.status}
                    status={item.status}
                    count={item.count}
                    total={totalOrdersAllStatuses}
                    color={meta.color}
                    icon={meta.icon}
                  />
                );
              })}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Delivery rate</span>
                <span
                  className="text-sm font-black rounded-full px-2.5 py-1"
                  style={{ background: '#d1fae5', color: '#059669' }}
                >
                  {totalOrdersAllStatuses > 0 ? Math.round((deliveredCount / totalOrdersAllStatuses) * 100) : 0}%
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ── Col 2: CATEGORY SALES ── */}
        <section className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6">
          <SectionHeader
            icon={<Package className="h-4 w-4" />}
            title="Category Sales"
            subtitle="Top 8 categories by revenue"
            gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          />
          {catLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : !categorySales || categorySales.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No category data</p>
          ) : (
            <div className="space-y-3">
              {categorySales.slice(0, 8).map((cat, i) => {
                const color = CAT_COLORS[i % CAT_COLORS.length] ?? '#9ca3af';
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 truncate pr-2">{cat.category}</span>
                        <span className="text-xs font-black text-gray-800 flex-shrink-0">{formatCurrency(cat.revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max((cat.revenue / maxCatRevenue) * 100, 2)}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Col 3: TOP CUSTOMERS ── */}
        <section className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6">
          <SectionHeader
            icon={<Users className="h-4 w-4" />}
            title="Top Customers"
            subtitle="Ranked by total spend"
            gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          />
          {customersLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : !topCustomers || topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No customer data</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.slice(0, 8).map((c, i) => {
                const name = c.user
                  ? `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim() || c.user.email
                  : 'Unknown';
                const avatarColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                const initials = name !== 'Unknown'
                  ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : '?';
                return (
                  <div key={c.user?.id ?? i} className="flex items-center gap-3">
                    <RankBadge rank={i + 1} />
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: avatarColors[i % avatarColors.length] ?? '#9ca3af' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-400">
                        {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black text-gray-800 flex-shrink-0">
                      {formatCurrency(c.totalSpent)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
