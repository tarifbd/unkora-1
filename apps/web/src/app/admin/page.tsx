'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users, AlertTriangle, Star,
  ArrowRight, Loader2, Plus, Tag, FileBarChart, Activity, Clock,
  CheckCircle2, XCircle, Truck, RefreshCw, Zap, ShoppingCart,
  Layers, CreditCard, Banknote, LayoutGrid, ChevronRight, Sparkles, Bot,
  Download, Minus, Command,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

// ─── Time period options ────────────────────────────────────────────────────────
const PERIODS = [
  { key: '7',   label: '7D',  days: 7 },
  { key: '30',  label: '30D', days: 30 },
  { key: '90',  label: '90D', days: 90 },
  { key: '365', label: '1Y',  days: 365 },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

// ─── Live clock hook ────────────────────────────────────────────────────────────
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

// ─── Trend delta: % change of recent half vs prior half ────────────────────────
function windowDelta(series: number[], window: number): number | null {
  if (series.length < window * 2) return null;
  const recent = series.slice(-window).reduce((a, b) => a + b, 0);
  const prior = series.slice(-window * 2, -window).reduce((a, b) => a + b, 0);
  if (prior === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prior) / prior) * 100);
}

// ─── Trend pill ─────────────────────────────────────────────────────────────────
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

// ─── SVG Area Chart (gradient fill + interactive crosshair) ────────────────────
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

  // x-axis labels: show first, middle, last
  const labelIndices = n <= 1 ? [0] : [0, Math.floor(n / 2), n - 1];

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
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(t => (
          <line key={t}
            x1={pad.left} x2={pad.left + innerW}
            y1={pad.top + innerH * t} y2={pad.top + innerH * t}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
        ))}

        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth={2.5} strokeLinecap="round" />}

        {/* x-axis labels */}
        {labelIndices.map(i => {
          const p = points[i];
          if (!p) return null;
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          return (
            <text key={i} x={p.x} y={h - 4} textAnchor={anchor} fontSize={9} fill="rgba(165,180,252,0.55)" fontFamily="monospace">
              {p.label}
            </text>
          );
        })}

        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={pad.top} y2={pad.top + innerH} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <circle cx={hp.x} cy={hp.y} r={6} fill="#fff" opacity={0.15} />
            <circle cx={hp.x} cy={hp.y} r={3.5} fill="#fff" />
          </>
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{
            left: Math.min(Math.max(hp.x, 60), w - 60),
            top: 4,
            transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.96)',
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

// ─── Donut chart ────────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 100, label }: { slices: { label: string; value: number; color: string }[]; size?: number; label?: string }) {
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
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div style={{ background: `conic-gradient(${segments.join(', ')})`, borderRadius: '50%', width: size, height: size }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: hole, height: hole, borderRadius: '50%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{total}</span>
          {label && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-300 flex-1 truncate text-[11px]">{s.label}</span>
            <span className="font-bold text-white text-[11px]">{s.value}</span>
            <span className="text-slate-500 w-8 text-right text-[10px]">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────────
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

// ─── Stars ──────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className="h-3 w-3" style={{ color: n <= rating ? '#f59e0b' : '#e5e7eb', fill: n <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, gradient, subColor, labelColor, icon, delta, spark }: {
  label: string; value: string; sub: string; gradient: string;
  subColor: string; labelColor: string; icon: React.ReactNode;
  delta?: number | null; spark?: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 group cursor-default" style={{ background: gradient }}>
      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>{label}</p>
          <p className="text-xl font-black mt-1 tracking-tight leading-none">{value}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {delta !== undefined && <TrendPill delta={delta} light />}
            <p className="text-[11px] font-medium truncate" style={{ color: subColor }}>{sub}</p>
          </div>
        </div>
        <div className="rounded-xl p-2.5 flex-shrink-0 ml-2" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}>
          {icon}
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div className="relative mt-3 flex items-end gap-px h-6 opacity-60">
          {spark.map((v, i) => {
            const m = Math.max(...spark, 1);
            return <div key={i} className="flex-1 rounded-t bg-white/50" style={{ height: `${Math.max((v / m) * 100, 4)}%` }} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Card ───────────────────────────────────────────────────────────────
function PipelineCard({ label, count, icon, bg, color, href }: {
  label: string; count: number; icon: React.ReactNode;
  bg: string; color: string; href: string;
}) {
  return (
    <Link href={href} className="rounded-xl p-3 flex items-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 group" style={{ background: bg }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-black leading-none" style={{ color }}>{count}</p>
        <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">{label}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, headerGradient, action, children }: {
  title: string; subtitle: string; headerGradient?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow" style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ background: headerGradient ?? 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p className="font-bold text-sm text-white">{title}</p>
          <p className="text-xs mt-0.5 text-slate-400">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Mini Stat ───────────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl hover:shadow-sm transition-all" style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-base font-black text-white truncate leading-none">{value}</p>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── AI Sales Forecast Widget ────────────────────────────────────────────────────
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
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-white/20"><Bot className="h-4 w-4 text-white" /></div>
          <div>
            <p className="font-bold text-sm text-white">AI Sales Forecast</p>
            <p className="text-[11px] text-white/60">Powered by AI analysis</p>
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
          <p className="text-sm text-slate-300 leading-relaxed">{forecast}</p>
        ) : mutation.isPending ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-400">Generating AI-powered forecast…</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Bot className="h-8 w-8 text-indigo-700 flex-shrink-0" />
            <p className="text-sm text-slate-400">Click Generate to get an AI-powered sales forecast and recommendations based on your current store data.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────────
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
          <p className="text-sm font-medium text-gray-400">Loading command center…</p>
        </div>
      </div>
    );
  }

  const chartData = chart?.map(p => ({ label: p.date?.slice(5) ?? '', value: p.revenue ?? 0 })) ?? [];
  const chartSeries = chartData.map(d => d.value);
  const recentOrders = stats?.recentOrders?.slice(0, 5) ?? [];
  const topProducts = stats?.topProducts?.slice(0, 5) ?? [];
  const lowStockCount = stats?.products?.lowStock ?? 0;
  const todayRevenue = stats?.revenue?.today ?? 0;
  const monthRevenue = stats?.revenue?.thisMonth ?? 0;

  const revenueDelta = windowDelta(chartSeries, Math.floor(chartSeries.length / 2) || 1);
  const periodRevenue = chartSeries.reduce((a, b) => a + b, 0);

  const byStatus = stats?.orders?.byStatus ?? {};
  const byPayment = stats?.orders?.byPayment ?? {};

  const pipelineCards = [
    { label: 'Pending',         key: 'PENDING',          icon: <ShoppingCart className="w-3.5 h-3.5" />, bg: '#fffbeb', color: '#d97706', href: '/admin/orders?status=PENDING' },
    { label: 'Confirmed',       key: 'CONFIRMED',         icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: '#eff6ff', color: '#2563eb', href: '/admin/orders?status=CONFIRMED' },
    { label: 'Processing',      key: 'PROCESSING',        icon: <RefreshCw className="w-3.5 h-3.5" />,    bg: '#f5f3ff', color: '#7c3aed', href: '/admin/orders?status=PROCESSING' },
    { label: 'Shipped',         key: 'SHIPPED',           icon: <Truck className="w-3.5 h-3.5" />,        bg: '#ecfdf5', color: '#059669', href: '/admin/orders?status=SHIPPED' },
    { label: 'Out for Delivery',key: 'OUT_FOR_DELIVERY',  icon: <Truck className="w-3.5 h-3.5" />,        bg: '#f0fdf4', color: '#16a34a', href: '/admin/orders' },
    { label: 'Delivered',       key: 'DELIVERED',         icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: '#d1fae5', color: '#065f46', href: '/admin/orders?status=DELIVERED' },
    { label: 'Cancelled',       key: 'CANCELLED',         icon: <XCircle className="w-3.5 h-3.5" />,      bg: '#fef2f2', color: '#dc2626', href: '/admin/orders?status=CANCELLED' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#6366f1',
    SHIPPED: '#8b5cf6', OUT_FOR_DELIVERY: '#10b981', DELIVERED: '#059669', CANCELLED: '#ef4444',
  };
  const statusSlices = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#9ca3af' }));

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

  const catColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const catMax = Math.max(...(categorySales ?? []).map(c => c.revenue), 1);

  // "Last updated X seconds ago"
  const secAgo = dataUpdatedAt ? Math.floor((now.getTime() - dataUpdatedAt) / 1000) : null;
  const updatedLabel = secAgo === null ? '' : secAgo < 5 ? 'just now' : `${secAgo}s ago`;

  // Sparkline buckets for revenue
  const revSpark = chartSeries.slice(-14);

  // Today as % of avg daily in period
  const avgDaily = periodRevenue / (periodDays || 1);
  const todayPct = avgDaily > 0 ? Math.round((todayRevenue / avgDaily) * 100) : 0;

  return (
    <div className="space-y-4 pb-10" style={{ background: '#0a0f1e', minHeight: '100vh' }}>

      {/* ── Command Bar Header ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #0f172a 100%)' }}
      >
        {/* ambient blobs */}
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-8 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 top-0 h-32 w-32 rounded-full bg-cyan-500/8 blur-2xl pointer-events-none" />

        <div className="relative px-6 py-5">
          {/* top row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo pulse */}
              <div className="relative flex-shrink-0">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
                  <Command className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
                  {greeting(now.getHours())}, Admin
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> LIVE
                  </span>
                </h1>
                <p className="text-xs text-indigo-300/70 mt-0.5 flex items-center gap-2">
                  <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <span className="text-indigo-500">·</span>
                  <span className="font-mono tabular-nums text-indigo-200">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {updatedLabel && (
                    <>
                      <span className="text-indigo-500">·</span>
                      <span className="text-slate-400">Updated {updatedLabel}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={refreshAll}
                title="Refresh all data"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={exportChartCsv}
                title="Export chart CSV"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <Link href="/admin/reports" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <FileBarChart className="h-3.5 w-3.5" /> Reports
              </Link>
              <Link href="/admin/orders?status=PENDING" className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-indigo-900 bg-white shadow-lg hover:bg-indigo-50 transition-colors">
                Process Orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Revenue Today"
              value={formatCurrency(todayRevenue)}
              sub={`${todayPct}% of daily avg`}
              delta={null}
              gradient="linear-gradient(135deg, #059669, #10b981)"
              labelColor="#a7f3d0" subColor="#6ee7b7"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <KpiCard
              label="Monthly Revenue"
              value={formatCurrency(monthRevenue)}
              sub={`${periodDays}D total: ${formatCurrency(periodRevenue)}`}
              delta={revenueDelta}
              spark={revSpark}
              gradient="linear-gradient(135deg, #4f46e5, #6366f1)"
              labelColor="#c7d2fe" subColor="#a5b4fc"
              icon={<CreditCard className="w-4 h-4" />}
            />
            <KpiCard
              label="Total Orders"
              value={String(stats?.orders?.total ?? 0)}
              sub={`${stats?.orders?.pending ?? 0} pending now`}
              gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
              labelColor="#bfdbfe" subColor="#93c5fd"
              icon={<ShoppingBag className="w-4 h-4" />}
            />
            <KpiCard
              label="Pending"
              value={String(stats?.orders?.pending ?? 0)}
              sub="Awaiting action"
              gradient="linear-gradient(135deg, #d97706, #f59e0b)"
              labelColor="#fef3c7" subColor="#fde68a"
              icon={<Clock className="w-4 h-4" />}
            />
            <KpiCard
              label="Customers"
              value={String(stats?.customers?.total ?? 0)}
              sub={`+${stats?.customers?.newThisMonth ?? 0} this month`}
              gradient="linear-gradient(135deg, #7c3aed, #8b5cf6)"
              labelColor="#ede9fe" subColor="#ddd6fe"
              icon={<Users className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* ── Main 2-column grid: chart (3fr) + pipeline (2fr) ──────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* LEFT: Revenue Area Chart */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div>
              <p className="font-bold text-white text-sm flex items-center gap-2">
                Revenue Trend <TrendPill delta={revenueDelta} light />
              </p>
              <p className="text-indigo-300/60 text-[11px] mt-0.5">
                {formatCurrency(periodRevenue)} · last {periodDays} days · hover for daily totals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${period === p.key ? 'bg-white text-indigo-900' : 'text-indigo-300 hover:text-white'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Link href="/admin/reports" className="flex items-center gap-1 text-[11px] font-medium rounded-lg px-2 py-1.5 text-indigo-300 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                Full report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="px-3 pb-3">
            {chartData.length > 0
              ? <AreaChart data={chartData} height={280} />
              : <p className="py-16 text-center text-sm text-indigo-400">No revenue data yet — start making sales!</p>
            }
          </div>
        </div>

        {/* RIGHT: Order Pipeline Donut + status breakdown */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-lg flex flex-col" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Order Pipeline
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">Live status distribution</p>
          </div>

          {/* Donut */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {statusSlices.length > 0
              ? <DonutChart slices={statusSlices} size={96} label="total" />
              : <p className="py-6 text-center text-sm text-slate-500">No order data yet</p>
            }
          </div>

          {/* Animated progress bars per status */}
          <div className="px-5 py-4 flex-1 space-y-2.5 overflow-auto">
            {pipelineCards.map(c => {
              const cnt = byStatus[c.key] ?? 0;
              const total = Math.max(stats?.orders?.total ?? 0, 1);
              const pct = Math.round((cnt / total) * 100);
              return (
                <Link key={c.key} href={c.href} className="block group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: c.color }}>{c.icon}</span>
                      <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-white">{cnt}</span>
                      <span className="text-[10px] text-slate-500 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, background: c.color }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/admin/orders" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition-colors">
              <Activity className="w-3.5 h-3.5" /> View all orders
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom 3-column grid ──────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Recent Orders compact table */}
        <SectionCard
          title="Recent Orders"
          subtitle="Last 5 transactions"
          action={
            <Link href="/admin/orders" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-300 transition-colors" style={{ background: 'rgba(99,102,241,0.15)' }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {recentOrders.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-slate-500">No orders yet</p>
              : recentOrders.map(order => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white">#{order.orderNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {order.user?.firstName ?? '—'} {order.user?.lastName ?? ''}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="font-black text-xs text-white flex-shrink-0 tabular-nums">{formatCurrency(Number(order.total ?? 0))}</span>
                </Link>
              ))
            }
          </div>
        </SectionCard>

        {/* Top Categories ranked list */}
        <SectionCard
          title="Top Categories"
          subtitle="Revenue by category"
          action={
            <Link href="/admin/categories" className="text-[11px] font-semibold text-purple-300 hover:underline">View all</Link>
          }
        >
          <div className="px-4 py-3 space-y-3">
            {categorySales && categorySales.length > 0 ? (
              categorySales.slice(0, 6).map((d, i) => (
                <div key={d.category}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[10px] font-black text-slate-500 w-3 flex-shrink-0">{i + 1}</span>
                      <span className="text-[11px] text-slate-200 font-medium truncate">{d.category}</span>
                    </div>
                    <span className="text-[11px] font-black text-white ml-2 flex-shrink-0">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max((d.revenue / catMax) * 100, 3)}%`,
                        background: `linear-gradient(90deg, ${catColors[i % catColors.length]}, ${catColors[(i + 1) % catColors.length]})`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No category data yet</p>
            )}
          </div>
        </SectionCard>

        {/* AI Forecast */}
        <AiForecastWidget stats={stats} chart={chart} />
      </div>

      {/* ── 2nd support row: Top Customers + Payment Methods + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Top Customers */}
        <SectionCard
          title="Top Customers"
          subtitle="Highest lifetime value"
          headerGradient="linear-gradient(135deg, #1e1b4b, #312e81)"
          action={
            <Link href="/admin/users" className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 text-indigo-300 transition-colors" style={{ background: 'rgba(99,102,241,0.15)' }}>
              All users <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {!topCustomers || topCustomers.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-slate-500">No customer data yet</p>
              : topCustomers.map((c, i) => {
                  const rankColors = ['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6'];
                  const name = c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email : 'Unknown';
                  return (
                    <div key={c.user?.id ?? i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ background: rankColors[i] ?? '#9ca3af' }}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-white truncate">{name}</p>
                        <p className="text-[10px] text-slate-400">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="font-black text-xs text-white flex-shrink-0 tabular-nums">{formatCurrency(c.totalSpent)}</span>
                    </div>
                  );
                })
            }
          </div>
        </SectionCard>

        {/* Payment Methods donut */}
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-sm text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" /> Payment Methods
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">COD vs online breakdown</p>
          </div>
          <div className="px-5 py-4">
            {paymentSlices.length > 0
              ? <DonutChart slices={paymentSlices} size={96} label="orders" />
              : <p className="py-8 text-center text-sm text-slate-500">No order data yet</p>
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #052e16, #14532d)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="rounded-lg p-1.5 bg-green-800/50"><Zap className="h-4 w-4 text-green-400" /></div>
            <div>
              <p className="font-bold text-sm text-green-300">Quick Actions</p>
              <p className="text-[11px] text-green-600">Common admin tasks</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-3 gap-2">
            {[
              { href: '/admin/products/new',    label: 'Add Product',     icon: <Plus className="h-4 w-4" />,        bg: 'linear-gradient(135deg, #10b981, #059669)' },
              { href: '/admin/coupons',         label: 'Coupons',         icon: <Tag className="h-4 w-4" />,         bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { href: '/admin/flash-deals',     label: 'Flash Deals',     icon: <Zap className="h-4 w-4" />,         bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
              { href: '/admin/reports',         label: 'Reports',         icon: <FileBarChart className="h-4 w-4" />, bg: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
              { href: '/admin/inventory',       label: 'Inventory',       icon: <Package className="h-4 w-4" />,     bg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
              { href: '/admin/control-center',  label: 'Control Center',  icon: <LayoutGrid className="h-4 w-4" />,  bg: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center text-[10px] font-bold text-white shadow-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: a.bg }}>
                {a.icon}{a.label}
              </Link>
            ))}
          </div>

          {/* Low stock alert strip */}
          {lowStockCount > 0 && (
            <div className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-2.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-[11px] text-red-300 flex-1">{lowStockCount} items low on stock</p>
              <Link href="/admin/inventory" className="text-[10px] font-bold text-red-300 hover:text-red-200 flex-shrink-0">Fix →</Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
