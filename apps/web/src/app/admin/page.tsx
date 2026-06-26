'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users, AlertTriangle, Star,
  ArrowRight, Loader2, Plus, Tag, FileBarChart, Activity, Clock,
  CheckCircle2, XCircle, Truck, RefreshCw, Zap, ShoppingCart,
  Layers, CreditCard, Banknote, LayoutGrid, ChevronRight, Sparkles, Bot,
  Download, Minus,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

// ─── Time period options (drives the revenue chart query) ──────────────────────
const PERIODS = [
  { key: '7',   label: '7D',  days: 7 },
  { key: '30',  label: '30D', days: 30 },
  { key: '90',  label: '90D', days: 90 },
  { key: '365', label: '1Y',  days: 365 },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

// ─── Live clock hook ───────────────────────────────────────────────────────────
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

// ─── Trend helper: % change of recent window vs prior window ───────────────────
function windowDelta(series: number[], window: number): number | null {
  if (series.length < window * 2) return null;
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

// ─── Cutting-edge SVG Area Chart (gradient fill + interactive crosshair) ───────
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

  const pad = { top: 16, right: 8, bottom: 8, left: 8 };
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

  // Smooth cubic path (Catmull-Rom → Bézier)
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
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < best) { best = d; nearest = i; }
    });
    setHover(points.length > 0 ? nearest : null);
  }, [points]);

  const hp = hover !== null ? points[hover] : null;

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
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t}
            x1={pad.left} x2={pad.left + innerW}
            y1={pad.top + innerH * t} y2={pad.top + innerH * t}
            stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="4 4" />
        ))}

        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth={2.5} strokeLinecap="round" />}

        {/* crosshair + active point */}
        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={pad.top} y2={pad.top + innerH} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
            <circle cx={hp.x} cy={hp.y} r={6} fill="#fff" opacity={0.25} />
            <circle cx={hp.x} cy={hp.y} r={3.5} fill="#fff" />
          </>
        )}
      </svg>

      {/* tooltip */}
      {hp && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{
            left: Math.min(Math.max(hp.x, 50), w - 50),
            top: 0,
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
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 110, label }: { slices: { label: string; value: number; color: string }[]; size?: number; label?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const segments: string[] = [];
  for (const slice of slices) {
    const start = (cumulative / total) * 100;
    cumulative += slice.value;
    const end = (cumulative / total) * 100;
    segments.push(`${slice.color} ${start}% ${end}%`);
  }
  const hole = size * 0.48;
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div style={{ background: `conic-gradient(${segments.join(', ')})`, borderRadius: '50%', width: size, height: size, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: hole, height: hole, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{total}</span>
          {label && <span style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 flex-1 truncate">{s.label}</span>
            <span className="font-black text-gray-800">{s.value}</span>
            <span className="text-gray-400 w-9 text-right">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    DELIVERED:         { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="h-3 w-3" /> },
    PENDING:           { bg: '#fef3c7', color: '#92400e', icon: <Clock className="h-3 w-3" /> },
    CONFIRMED:         { bg: '#e0f2fe', color: '#075985', icon: <CheckCircle2 className="h-3 w-3" /> },
    PROCESSING:        { bg: '#dbeafe', color: '#1e3a8a', icon: <RefreshCw className="h-3 w-3" /> },
    SHIPPED:           { bg: '#e0e7ff', color: '#3730a3', icon: <Truck className="h-3 w-3" /> },
    OUT_FOR_DELIVERY:  { bg: '#f0fdf4', color: '#166534', icon: <Truck className="h-3 w-3" /> },
    CANCELLED:         { bg: '#fee2e2', color: '#991b1b', icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', icon: null };
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.icon}{status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className="h-3.5 w-3.5" style={{ color: n <= rating ? '#f59e0b' : '#e5e7eb', fill: n <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

// ─── KPI Card (with mini trend + delta) ────────────────────────────────────────
function KpiCard({ label, value, sub, gradient, subColor, labelColor, icon, delta, spark }: {
  label: string; value: string; sub: string; gradient: string;
  subColor: string; labelColor: string; icon: React.ReactNode;
  delta?: number | null; spark?: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 group" style={{ background: gradient }}>
      {/* decorative blob */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: labelColor }}>{label}</p>
          <p className="text-2xl font-black mt-1.5 tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {delta !== undefined && <TrendPill delta={delta} light />}
            <p className="text-xs font-medium truncate" style={{ color: subColor }}>{sub}</p>
          </div>
        </div>
        <div className="rounded-xl p-3 flex-shrink-0 ml-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
          {icon}
        </div>
      </div>
      {/* mini sparkline */}
      {spark && spark.length > 1 && (
        <div className="relative mt-3 flex items-end gap-px h-7 opacity-70">
          {spark.map((v, i) => {
            const m = Math.max(...spark, 1);
            return <div key={i} className="flex-1 rounded-t bg-white/50" style={{ height: `${Math.max((v / m) * 100, 4)}%` }} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Order Pipeline Card ──────────────────────────────────────────────────────
function PipelineCard({ label, count, icon, bg, color, href }: {
  label: string; count: number; icon: React.ReactNode;
  bg: string; color: string; href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl p-4 flex items-center gap-3 border hover:shadow-md transition-all hover:-translate-y-0.5 group" style={{ background: bg }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black" style={{ color }}>{count}</p>
        <p className="text-xs font-semibold text-gray-600 truncate">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, headerGradient, action, children }: {
  title: string; subtitle: string; headerGradient?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{ background: headerGradient ?? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        <div>
          <p className="font-bold text-sm" style={{ color: headerGradient ? '#fff' : '#1f2937' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: headerGradient ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Mini Stat Row ────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:shadow-sm hover:border-gray-200 transition-all">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-gray-800 truncate">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── AI Sales Forecast Widget ─────────────────────────────────────────────────
function AiForecastWidget({ stats, chart }: { stats: any; chart: any[] | undefined }) {
  const [forecast, setForecast] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const totalRevenue = stats?.revenue?.total ?? 0;
      const monthRevenue = stats?.revenue?.thisMonth ?? 0;
      const todayRevenue = stats?.revenue?.today ?? 0;
      const totalOrders = stats?.orders?.total ?? 0;
      const pendingOrders = stats?.orders?.pending ?? 0;
      const chartSummary = (chart ?? []).slice(-7).map((d: any) => `${d.date}: ৳${d.revenue}`).join(', ');

      const prompt = `You are a sales analyst for UNKORA, a Bangladeshi eCommerce store.
Based on these metrics, provide a concise 2-3 sentence sales forecast and 2 actionable recommendations for this week.

Current metrics:
- Total revenue: ৳${totalRevenue}
- This month: ৳${monthRevenue}
- Today: ৳${todayRevenue}
- Total orders: ${totalOrders}
- Pending orders: ${pendingOrders}
- Last 7 days revenue: ${chartSummary || 'N/A'}

Keep the response practical and specific. Use ৳ for currency. No markdown, plain text only.`;

      const { data } = await api.post('/admin/ai/generate/custom', { prompt, outputFormat: 'text' });
      return String(data?.data?.generatedContent ?? data?.data?.content ?? 'Unable to generate forecast.');
    },
    onSuccess: (result) => setForecast(result),
  });

  return (
    <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl p-1.5 bg-white/20"><Bot className="h-4 w-4 text-white" /></div>
          <div>
            <p className="font-bold text-sm text-white">AI Sales Forecast</p>
            <p className="text-xs text-white/60">Powered by AI analysis</p>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {mutation.isPending ? 'Analyzing…' : forecast ? 'Refresh' : 'Generate'}
        </button>
      </div>
      <div className="p-4">
        {forecast ? (
          <p className="text-sm text-gray-700 leading-relaxed">{forecast}</p>
        ) : mutation.isPending ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-400">Generating AI-powered forecast…</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Bot className="h-8 w-8 text-indigo-200 flex-shrink-0" />
            <p className="text-sm text-gray-400">Click Generate to get an AI-powered sales forecast and recommendations based on your current store data.</p>
          </div>
        )}
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

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-revenue-chart'] });
    qc.invalidateQueries({ queryKey: ['admin-category-sales'] });
    qc.invalidateQueries({ queryKey: ['admin-top-customers'] });
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
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#6366f1' }} />
          <p className="text-sm font-medium text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const chartData = chart?.map(p => ({ label: p.date?.slice(5) ?? '', value: p.revenue ?? 0 })) ?? [];
  const chartSeries = chartData.map(d => d.value);
  const recentOrders = stats?.recentOrders?.slice(0, 8) ?? [];
  const topProducts = stats?.topProducts?.slice(0, 5) ?? [];
  const lowStockCount = stats?.products?.lowStock ?? 0;
  const todayRevenue = stats?.revenue?.today ?? 0;
  const monthRevenue = stats?.revenue?.thisMonth ?? 0;
  const todayPct = monthRevenue > 0 ? Math.round((todayRevenue / monthRevenue) * 100) : 0;

  // Trend deltas computed from the chart series (period-over-period)
  const revenueDelta = windowDelta(chartSeries, Math.floor(chartSeries.length / 2) || 1);
  const periodRevenue = chartSeries.reduce((a, b) => a + b, 0);

  // Order status pipeline
  const byStatus = stats?.orders?.byStatus ?? {};
  const pipelineCards = [
    { label: 'Order Placed', key: 'PENDING', icon: <ShoppingCart className="w-4 h-4" />, bg: '#fffbeb', color: '#d97706', href: '/admin/orders?status=PENDING' },
    { label: 'Confirmed', key: 'CONFIRMED', icon: <CheckCircle2 className="w-4 h-4" />, bg: '#eff6ff', color: '#2563eb', href: '/admin/orders?status=CONFIRMED' },
    { label: 'Processing', key: 'PROCESSING', icon: <RefreshCw className="w-4 h-4" />, bg: '#f5f3ff', color: '#7c3aed', href: '/admin/orders?status=PROCESSING' },
    { label: 'Shipped', key: 'SHIPPED', icon: <Truck className="w-4 h-4" />, bg: '#ecfdf5', color: '#059669', href: '/admin/orders?status=SHIPPED' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', icon: <Truck className="w-4 h-4" />, bg: '#f0fdf4', color: '#16a34a', href: '/admin/orders' },
    { label: 'Delivered', key: 'DELIVERED', icon: <CheckCircle2 className="w-4 h-4" />, bg: '#d1fae5', color: '#065f46', href: '/admin/orders?status=DELIVERED' },
    { label: 'Cancelled', key: 'CANCELLED', icon: <XCircle className="w-4 h-4" />, bg: '#fef2f2', color: '#dc2626', href: '/admin/orders?status=CANCELLED' },
  ];

  // Payment method donut
  const byPayment = stats?.orders?.byPayment ?? {};
  const PAYMENT_COLORS: Record<string, string> = {
    COD: '#f59e0b', BKASH: '#e11d48', NAGAD: '#f97316',
    ROCKET: '#8b5cf6', CARD: '#3b82f6', OTHER: '#6b7280',
  };
  const paymentSlices = Object.entries(byPayment)
    .filter(([, v]) => v > 0)
    .map(([method, count]) => ({
      label: method === 'COD' ? 'Cash on Delivery' : method,
      value: count,
      color: PAYMENT_COLORS[method] ?? '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

  // Order status donut
  const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#6366f1',
    SHIPPED: '#8b5cf6', OUT_FOR_DELIVERY: '#10b981', DELIVERED: '#059669', CANCELLED: '#ef4444',
  };
  const statusSlices = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#9ca3af' }));

  // Category bars
  const catColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const catMax = Math.max(...(categorySales ?? []).map(c => c.revenue), 1);

  // Activity feed
  const activityFeed = recentOrders.slice(0, 6).map(o => ({
    id: o.id,
    type: o.status === 'CANCELLED' ? 'cancelled' : o.status === 'DELIVERED' ? 'delivered' : 'new',
    text: `#${o.orderNumber} — ${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`.trim(),
    sub: o.status,
    amount: formatCurrency(Number(o.total ?? 0)),
  }));

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : now;

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)' }}>
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute right-24 bottom-0 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {greeting(now.getHours())}, Admin 👋
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-400 inline-block" />
                Live
              </span>
            </div>
            <p className="text-sm text-indigo-200/80">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}
              <span className="tabular-nums">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {' · Synced '}
              {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/15 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link href="/admin/reports" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/15 transition-colors">
              <FileBarChart className="h-4 w-4" /> Reports
            </Link>
            <Link href="/admin/orders?status=PENDING" className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-indigo-900 bg-white shadow-md hover:bg-indigo-50 transition-colors">
              Process Orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue" value={formatCurrency(stats?.revenue?.total ?? 0)}
          sub={`Today: ${formatCurrency(todayRevenue)}`}
          delta={revenueDelta} spark={chartSeries.slice(-12)}
          gradient="linear-gradient(135deg, #10b981, #059669)" labelColor="#a7f3d0" subColor="#6ee7b7"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Orders" value={String(stats?.orders?.total ?? 0)}
          sub={`${stats?.orders?.pending ?? 0} pending`}
          gradient="linear-gradient(135deg, #3b82f6, #4f46e5)" labelColor="#bfdbfe" subColor="#93c5fd"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Products" value={String(stats?.products?.total ?? 0)}
          sub={`${lowStockCount} low stock ${lowStockCount > 0 ? '⚠️' : '✓'}`}
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" labelColor="#ddd6fe" subColor="#c4b5fd"
          icon={<Package className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Customers" value={String(stats?.customers?.total ?? 0)}
          sub={`↑ ${stats?.customers?.newThisMonth ?? 0} new this month`}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)" labelColor="#fef3c7" subColor="#fde68a"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* ── Row 2: Mini Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MiniStat label="Today Revenue" value={formatCurrency(todayRevenue)} icon={<TrendingUp className="w-4 h-4" />} color="#10b981" />
        <MiniStat label="This Month" value={formatCurrency(stats?.revenue?.thisMonth ?? 0)} icon={<CreditCard className="w-4 h-4" />} color="#6366f1" />
        <MiniStat label="Categories" value={String(stats?.categories?.total ?? 0)} icon={<LayoutGrid className="w-4 h-4" />} color="#8b5cf6" />
        <MiniStat label="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle className="w-4 h-4" />} color="#ef4444" />
        <MiniStat label="New Customers" value={String(stats?.customers?.newThisMonth ?? 0)} icon={<Users className="w-4 h-4" />} color="#3b82f6" />
        <MiniStat label="Pending Orders" value={String(stats?.orders?.pending ?? 0)} icon={<Clock className="w-4 h-4" />} color="#f59e0b" />
        <MiniStat label="Abandoned Carts" value={String(stats?.orders?.abandonedCarts ?? 0)} icon={<ShoppingCart className="w-4 h-4" />} color="#f97316" />
      </div>

      {/* ── Row 3: Revenue Chart (interactive area chart + period control) ── */}
      <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="font-bold text-white text-sm flex items-center gap-2">
              Revenue Trend
              <TrendPill delta={revenueDelta} light />
            </p>
            <p className="text-indigo-300 text-xs mt-0.5">
              {formatCurrency(periodRevenue)} over last {periodDays} days · hover for daily totals
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="inline-flex rounded-lg bg-white/10 p-0.5 ring-1 ring-white/10">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${period === p.key ? 'bg-white text-indigo-900' : 'text-indigo-200 hover:text-white'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={exportChartCsv}
              className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 text-indigo-200 bg-white/10 hover:bg-white/20 ring-1 ring-white/10 transition-colors"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 text-indigo-200 bg-white/10 hover:bg-white/20 ring-1 ring-white/10 transition-colors">
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        {chartData.length > 0
          ? <AreaChart data={chartData} />
          : <p className="py-10 text-center text-sm text-indigo-400">No revenue data yet — start making sales!</p>
        }
      </div>

      {/* ── Row 4: Order Status Pipeline ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Order Status Pipeline
          </p>
          <Link href="/admin/orders" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
            View all orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineCards.map(c => (
            <PipelineCard key={c.key} label={c.label} count={byStatus[c.key] ?? 0} icon={c.icon} bg={c.bg} color={c.color} href={c.href} />
          ))}
        </div>
      </div>

      {/* ── Row 5: Charts + Top Categories ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Payment Method Split */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-500" /> Payment Methods
            </p>
            <p className="text-xs text-gray-400 mt-0.5">COD vs online breakdown</p>
          </div>
          {paymentSlices.length > 0
            ? <DonutChart slices={paymentSlices} label="orders" />
            : <p className="py-8 text-center text-sm text-gray-400">No order data yet</p>
          }
        </div>

        {/* Order Status Donut */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Order Distribution
            </p>
            <p className="text-xs text-gray-400 mt-0.5">By current status</p>
          </div>
          {statusSlices.length > 0
            ? <DonutChart slices={statusSlices} label="total" />
            : <p className="py-8 text-center text-sm text-gray-400">No order data yet</p>
          }
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-purple-500" /> Top Categories
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Revenue by category</p>
            </div>
            <Link href="/admin/categories" className="text-[10px] font-semibold text-purple-500 hover:underline">View all</Link>
          </div>
          {categorySales && categorySales.length > 0 ? (
            <div className="space-y-3">
              {categorySales.slice(0, 6).map((d, i) => (
                <div key={d.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-700 font-medium truncate max-w-[55%]">{d.category}</span>
                    <span className="text-xs font-bold text-gray-800">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max((d.revenue / catMax) * 100, 3)}%`, background: `linear-gradient(90deg, ${catColors[i % catColors.length]}, ${catColors[(i+1) % catColors.length]})` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No category data yet</p>
          )}
        </div>
      </div>

      {/* ── Row 6: Recent Orders + Top Products ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent Orders */}
        <SectionCard title="Recent Orders" subtitle="Latest transactions"
          action={
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
              : recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{order.user?.firstName} {order.user?.lastName}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <span className="font-black text-sm text-gray-800 w-20 text-right">{formatCurrency(Number(order.total ?? 0))}</span>
                    <Link href={`/admin/orders/${order.id}`} className="text-xs font-semibold rounded-lg px-2 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex-shrink-0">
                      View →
                    </Link>
                  </div>
                </div>
              ))
            }
          </div>
        </SectionCard>

        {/* Top Products */}
        <SectionCard title="Top Selling Products" subtitle="Best performers by revenue"
          action={
            <Link href="/admin/products" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {topProducts.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No sales data yet</p>
              : topProducts.map((p, i) => {
                const rankColors = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
                return (
                  <div key={p.productId} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: rankColors[i] ?? '#9ca3af' }}>{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p._sum.quantity ?? 0} units sold</p>
                    </div>
                    <span className="font-black text-sm text-gray-800 flex-shrink-0">{formatCurrency(Number(p._sum.totalPrice ?? 0))}</span>
                  </div>
                );
              })
            }
          </div>
        </SectionCard>
      </div>

      {/* ── Row 7: Top Customers + Quick Actions + Low Stock ──────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Top Customers */}
        <SectionCard title="Top Customers" subtitle="Highest lifetime value · All time"
          headerGradient="linear-gradient(135deg, #1e1b4b, #312e81)"
          action={
            <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-indigo-300 bg-indigo-300/10 hover:bg-indigo-300/20 transition-colors">
              All users <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {!topCustomers || topCustomers.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No customer data yet</p>
              : topCustomers.map((c, i) => {
                const rankColors = ['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6'];
                const name = c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email : 'Unknown';
                return (
                  <div key={c.user?.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: rankColors[i] ?? '#9ca3af' }}>
                      {name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="font-black text-sm text-gray-800 flex-shrink-0">{formatCurrency(c.totalSpent)}</span>
                  </div>
                );
              })
            }
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}>
            <div className="rounded-xl p-2 bg-green-100"><Zap className="h-4 w-4 text-green-700" /></div>
            <div>
              <p className="font-bold text-sm text-green-800">Quick Actions</p>
              <p className="text-xs text-green-600">Common admin tasks</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {[
              { href: '/admin/products/new', label: 'Add Product', icon: <Plus className="h-5 w-5" />, bg: 'linear-gradient(135deg, #10b981, #059669)' },
              { href: '/admin/coupons', label: 'Coupons', icon: <Tag className="h-5 w-5" />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { href: '/admin/flash-deals', label: 'Flash Deals', icon: <Zap className="h-5 w-5" />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
              { href: '/admin/reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" />, bg: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
              { href: '/admin/inventory', label: 'Inventory', icon: <Package className="h-5 w-5" />, bg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
              { href: '/admin/control-center', label: 'Control Center', icon: <LayoutGrid className="h-5 w-5" />, bg: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: a.bg }}>
                {a.icon}{a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock + Reviews */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
              <div className="rounded-xl p-1.5 bg-orange-100"><AlertTriangle className="h-4 w-4 text-orange-700" /></div>
              <div>
                <p className="font-bold text-sm text-orange-800">Low Stock Alerts</p>
                <p className="text-xs text-orange-600">{lowStockCount > 0 ? `${lowStockCount} items need restocking` : 'All stock levels healthy'}</p>
              </div>
            </div>
            <div className="p-4">
              {lowStockCount === 0
                ? <div className="flex items-center gap-2 py-2"><CheckCircle2 className="h-5 w-5 text-green-500" /><p className="text-sm text-gray-500">All products well stocked</p></div>
                : <div className="space-y-2">
                    {topProducts.slice(0, 3).map(p => (
                      <div key={p.productId} className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-gray-700 truncate flex-1">{p.productName}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 flex-shrink-0">Low</span>
                      </div>
                    ))}
                    <Link href="/admin/inventory" className="flex items-center gap-1 text-xs font-semibold text-orange-600 mt-2">
                      <Zap className="h-3 w-3" /> Manage inventory
                    </Link>
                  </div>
              }
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}>
              <div className="rounded-xl p-1.5 bg-yellow-100"><Star className="h-4 w-4 text-yellow-700" /></div>
              <div>
                <p className="font-bold text-sm text-yellow-800">Recent Reviews</p>
                <p className="text-xs text-yellow-600">Latest product feedback</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {topProducts.slice(0, 2).map((p, i) => (
                <div key={p.productId} className="p-2.5 rounded-xl bg-gray-50">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={5 - i} />
                    <span className="text-[10px] text-gray-400">Verified</span>
                  </div>
                </div>
              ))}
              <Link href="/admin/reviews" className="flex items-center gap-1 text-xs font-semibold text-yellow-700 mt-1">
                All reviews <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 8: Live Activity Feed ─────────────────────────────────── */}
      {activityFeed.length > 0 && (
        <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="h-2 w-2 rounded-full animate-pulse bg-green-400" />
            <p className="font-bold text-sm text-white tracking-wide">Live Activity Feed</p>
            <span className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-500 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" /> LIVE
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activityFeed.map((item, i) => {
              const cfg = item.type === 'cancelled'
                ? { bg: '#fee2e2', icon: <XCircle className="h-4 w-4 text-red-500" /> }
                : item.type === 'delivered'
                ? { bg: '#d1fae5', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> }
                : { bg: '#eff6ff', icon: <ShoppingBag className="h-4 w-4 text-blue-500" /> };
              return (
                <div key={item.id ?? i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-sm text-gray-700">{item.amount}</span>
                    <StatusBadge status={item.sub} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI Sales Forecast ─────────────────────────────────────────── */}
      <AiForecastWidget stats={stats} chart={chart} />

    </div>
  );
}
