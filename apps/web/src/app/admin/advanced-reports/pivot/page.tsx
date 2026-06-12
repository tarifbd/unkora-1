'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Columns3, Download, Filter, LayoutGrid,
  Loader2, RefreshCw, Rows3, Sigma, Table2, X, BarChart2,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';
import api from '@/lib/api';

/* ── Config ──────────────────────────────────────────────────────── */

const DIMENSIONS = [
  { id: 'date',          label: 'Date (Daily)',     group: 'Time' },
  { id: 'week',          label: 'Week',             group: 'Time' },
  { id: 'month',         label: 'Month',            group: 'Time' },
  { id: 'hour',          label: 'Hour of Day',      group: 'Time' },
  { id: 'weekday',       label: 'Day of Week',      group: 'Time' },
  { id: 'division',      label: 'Division',         group: 'Region' },
  { id: 'district',      label: 'District',         group: 'Region' },
  { id: 'city',          label: 'City',             group: 'Region' },
  { id: 'category',      label: 'Category',         group: 'Catalogue' },
  { id: 'product',       label: 'Product',          group: 'Catalogue' },
  { id: 'paymentMethod', label: 'Payment Method',   group: 'Order' },
  { id: 'paymentStatus', label: 'Payment Status',   group: 'Order' },
  { id: 'status',        label: 'Order Status',     group: 'Order' },
  { id: 'customerType',  label: 'New vs Returning', group: 'Customer' },
] as const;

const METRICS = [
  { id: 'revenue',      label: 'Revenue',         money: true },
  { id: 'orders',       label: 'Orders',          money: false },
  { id: 'unitsSold',    label: 'Units Sold',       money: false },
  { id: 'aov',          label: 'Avg Order Value',  money: true },
  { id: 'discount',     label: 'Discount',         money: true },
  { id: 'shipping',     label: 'Shipping',         money: true },
  { id: 'customers',    label: 'Customers',        money: false },
  { id: 'newCustomers', label: 'New Customers',    money: false },
] as const;

type MetricId = typeof METRICS[number]['id'];

const DATE_PRESETS = [
  { id: '7',   label: 'Last 7 days' },
  { id: '30',  label: 'Last 30 days' },
  { id: '90',  label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
] as const;

const ORDER_STATUSES  = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_METHODS = ['COD', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK_TRANSFER'];

/* ── Column presets (FB Ads Manager style) ───────────────────────── */

interface ColumnPreset {
  id: string;
  label: string;
  rows: string[];
  metrics: MetricId[];
  col?: string;
}

const COLUMN_PRESETS: ColumnPreset[] = [
  { id: 'revenue',   label: '৳ Revenue',      rows: ['date'],          metrics: ['revenue', 'orders', 'aov'],           col: '' },
  { id: 'region',    label: '🗺 By Region',    rows: ['division'],      metrics: ['revenue', 'orders', 'customers'],      col: '' },
  { id: 'product',   label: '📦 By Product',  rows: ['category', 'product'], metrics: ['revenue', 'unitsSold', 'orders'],col: '' },
  { id: 'payment',   label: '💳 By Payment',  rows: ['paymentMethod'], metrics: ['revenue', 'orders', 'aov'],           col: '' },
  { id: 'customer',  label: '👥 Customers',   rows: ['month'],         metrics: ['customers', 'newCustomers', 'revenue'], col: 'customerType' },
  { id: 'custom',    label: '✏️ Custom',       rows: ['date'],          metrics: ['revenue', 'orders'],                  col: '' },
];

interface PivotResponse {
  from: string;
  to: string;
  rows: { keys: Record<string, string>; metrics: Record<string, number>; cells?: Record<string, Record<string, number> | null> }[];
  colValues: string[];
  totals: Record<string, number>;
  meta: { ordersScanned: number };
}

const fmt = (v: number, money: boolean) =>
  money ? `৳${v.toLocaleString('en-BD', { maximumFractionDigits: 0 })}` : v.toLocaleString('en-BD');

const CHART_COLORS = ['#6366f1', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b'];

/* ── Page ────────────────────────────────────────────────────────── */

export default function PivotReportPage() {
  const [activePreset, setActivePreset] = useState('revenue');
  const [preset, setPreset] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rows, setRows] = useState<string[]>(['date']);
  const [col, setCol] = useState<string>('');
  const [metrics, setMetrics] = useState<MetricId[]>(['revenue', 'orders', 'aov']);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [panelOpen, setPanelOpen] = useState(true);

  const applyPreset = (p: ColumnPreset) => {
    setActivePreset(p.id);
    setRows(p.rows);
    setMetrics(p.metrics);
    setCol(p.col ?? '');
    setSortBy(p.metrics[0]);
    setSortDir('desc');
  };

  const { from, to } = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo };
    const days = parseInt(preset, 10) || 30;
    const t = new Date();
    const f = new Date(t.getTime() - days * 86400000);
    return { from: f.toISOString().slice(0, 10), to: t.toISOString().slice(0, 10) };
  }, [preset, customFrom, customTo]);

  const query = useQuery({
    queryKey: ['pivot-report', from, to, rows, col, metrics, statusFilter, paymentFilter],
    queryFn: () =>
      api
        .post('/advanced-reports/pivot', {
          from, to, rows, col: col || undefined, metrics,
          filters: {
            ...(statusFilter.length ? { status: statusFilter } : {}),
            ...(paymentFilter.length ? { paymentMethod: paymentFilter } : {}),
          },
        })
        .then(r => r.data.data as PivotResponse),
    enabled: rows.length > 0 && metrics.length > 0,
    staleTime: 60_000,
  });

  const data = query.data;

  const sortedRows = useMemo(() => {
    if (!data) return [];
    const copy = [...data.rows];
    const timeDim = rows.find(r => ['date', 'week', 'month', 'hour'].includes(r));
    if (sortBy === '__dim' && timeDim) {
      copy.sort((a, b) => (a.keys[timeDim] ?? '').localeCompare(b.keys[timeDim] ?? ''));
      if (sortDir === 'desc') copy.reverse();
    } else {
      copy.sort((a, b) => ((b.metrics[sortBy] ?? 0) - (a.metrics[sortBy] ?? 0)) * (sortDir === 'desc' ? 1 : -1));
    }
    return copy;
  }, [data, sortBy, sortDir, rows]);

  const maxByMetric = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of sortedRows) for (const k of metrics) m[k] = Math.max(m[k] ?? 0, r.metrics[k] ?? 0);
    return m;
  }, [sortedRows, metrics]);

  /* Chart data: top-20 rows, label = first dimension key, bars = each metric */
  const chartRows = useMemo(() => sortedRows.slice(0, 20).map(r => {
    const label = rows.map(d => r.keys[d]).join(' / ');
    const entry: Record<string, string | number> = { label };
    for (const m of metrics) entry[m] = r.metrics[m] ?? 0;
    return entry;
  }), [sortedRows, rows, metrics]);

  const primaryMetric = metrics[0] as MetricId;
  const primaryMoneyMetric = METRICS.find(m => m.id === primaryMetric)?.money ?? false;

  const toggleRow = (id: string) => {
    setActivePreset('custom');
    setRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : prev.length >= 3 ? prev : [...prev, id]);
  };
  const toggleMetric = (id: MetricId) => {
    setActivePreset('custom');
    setMetrics(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };
  const toggleIn = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const clickSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const exportCsv = () => {
    if (!data) return;
    const dimLabels = rows.map(r => DIMENSIONS.find(d => d.id === r)?.label ?? r);
    const metricCols = data.colValues.length
      ? data.colValues.flatMap(cv => metrics.map(m => `${cv} — ${METRICS.find(x => x.id === m)?.label}`))
      : [];
    const header = [...dimLabels, ...metrics.map(m => METRICS.find(x => x.id === m)?.label ?? m), ...metricCols];
    const lines = sortedRows.map(r => {
      const dims = rows.map(d => `"${(r.keys[d] ?? '').replace(/"/g, '""')}"`);
      const totals = metrics.map(m => r.metrics[m] ?? 0);
      const cells = data.colValues.flatMap(cv => metrics.map(m => r.cells?.[cv]?.[m] ?? 0));
      return [...dims, ...totals, ...cells].join(',');
    });
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pivot-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  const groups = [...new Set(DIMENSIONS.map(d => d.group))];

  return (
    <div className="space-y-0 flex flex-col h-full">
      {/* ── Sticky toolbar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/advanced-reports" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="rounded-lg bg-violet-100 p-2">
            <Table2 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold leading-tight">Report Builder</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Pivot any breakdown against any metric</p>
          </div>
        </div>

        {/* Column preset tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {COLUMN_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                activePreset === p.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${viewMode === 'chart' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <BarChart2 className="h-3.5 w-3.5" /> Chart
            </button>
          </div>

          <button
            onClick={() => query.refetch()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCsv}
            disabled={!data || sortedRows.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex gap-0 flex-1 pt-4">
        {/* Left panel toggle button (collapsed) */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="mr-3 flex h-fit items-center gap-1 rounded-lg border bg-card px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* Left panel */}
        {panelOpen && (
          <div className="w-72 flex-shrink-0 mr-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configure</p>
              <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Date range */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Date Range
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DATE_PRESETS.map(p => (
                  <button key={p.id} onClick={() => setPreset(p.id)} className={chip(preset === p.id)}>
                    {p.label}
                  </button>
                ))}
                <button onClick={() => setPreset('custom')} className={chip(preset === 'custom')}>Custom</button>
              </div>
              {preset === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1.5 text-xs" />
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1.5 text-xs" />
                </div>
              )}
            </div>

            {/* Breakdown rows */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Rows3 className="h-4 w-4 text-muted-foreground" /> Breakdown (rows)
                </div>
                <span className="text-[10px] text-muted-foreground">{rows.length}/3</span>
              </div>
              {groups.map(g => (
                <div key={g}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{g}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DIMENSIONS.filter(d => d.group === g).map(d => (
                      <button key={d.id} onClick={() => toggleRow(d.id)} className={chip(rows.includes(d.id))}>
                        {rows.includes(d.id) && <span className="mr-1 font-bold">{rows.indexOf(d.id) + 1}.</span>}
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column dimension */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Columns3 className="h-4 w-4 text-muted-foreground" /> Compare across (columns)
              </div>
              <select
                value={col}
                onChange={e => { setCol(e.target.value); setActivePreset('custom'); }}
                className="w-full rounded-lg border bg-background px-2 py-2 text-xs"
              >
                <option value="">None — totals only</option>
                {DIMENSIONS.filter(d => !rows.includes(d.id)).map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sigma className="h-4 w-4 text-muted-foreground" /> Metrics
              </div>
              <div className="flex flex-wrap gap-1.5">
                {METRICS.map(m => (
                  <button key={m.id} onClick={() => toggleMetric(m.id)} className={chip(metrics.includes(m.id))}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex w-full items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" /> Filters
                </span>
                <span className="text-[10px] text-muted-foreground">{statusFilter.length + paymentFilter.length || 'none'}</span>
              </button>
              {showFilters && (
                <>
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ORDER_STATUSES.map(s => (
                        <button key={s} onClick={() => toggleIn(statusFilter, setStatusFilter, s)} className={chip(statusFilter.includes(s))}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PAYMENT_METHODS.map(p => (
                        <button key={p} onClick={() => toggleIn(paymentFilter, setPaymentFilter, p)} className={chip(paymentFilter.includes(p))}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(statusFilter.length > 0 || paymentFilter.length > 0) && (
                    <button
                      onClick={() => { setStatusFilter([]); setPaymentFilter([]); }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <X className="h-3 w-3" /> Clear all filters
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Results area */}
        <div className="flex-1 min-w-0">
          {query.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || sortedRows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-center">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No data for this range / breakdown</p>
              <p className="text-xs text-muted-foreground">Try a different date range or breakdown combination</p>
            </div>
          ) : viewMode === 'chart' ? (
            /* ── Chart View ─────────────────────────────────────────── */
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Top {Math.min(chartRows.length, 20)} rows · {sortedRows.length.toLocaleString()} total</span>
                <span>{data.from} → {data.to}</span>
              </div>

              {/* Area chart for time dimensions, bar chart for categories */}
              {rows.some(r => ['date', 'week', 'month', 'hour', 'weekday'].includes(r)) ? (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={chartRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      {metrics.map((m, i) => (
                        <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={v => primaryMoneyMetric ? `৳${(v/1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                    <Tooltip
                      formatter={(v: number, name: string) => {
                        const m = METRICS.find(x => x.id === name);
                        return [m?.money ? `৳${v.toLocaleString()}` : v.toLocaleString(), m?.label ?? name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={name => METRICS.find(x => x.id === name)?.label ?? name} />
                    {metrics.map((m, i) => (
                      <Area key={m} type="monotone" dataKey={m} stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        fill={`url(#grad-${m})`} strokeWidth={2} dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={chartRows} margin={{ top: 4, right: 8, left: 0, bottom: 60 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => primaryMoneyMetric ? `৳${(v/1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(v: number, name: string) => {
                        const m = METRICS.find(x => x.id === name);
                        return [m?.money ? `৳${v.toLocaleString()}` : v.toLocaleString(), m?.label ?? name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={name => METRICS.find(x => x.id === name)?.label ?? name} />
                    {metrics.map((m, i) => (
                      <Bar key={m} dataKey={m} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[0, 4, 4, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Quick summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
                {metrics.slice(0, 4).map(m => {
                  const meta = METRICS.find(x => x.id === m)!;
                  return (
                    <div key={m} className="text-center">
                      <p className="text-xs text-muted-foreground">{meta.label} (total)</p>
                      <p className="text-lg font-bold tabular-nums">{fmt(data.totals[m] ?? 0, meta.money)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Table View ─────────────────────────────────────────── */
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
                <span>{sortedRows.length.toLocaleString()} rows · {data.meta.ordersScanned.toLocaleString()} orders scanned</span>
                <span>{data.from} → {data.to}</span>
              </div>
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                    {data.colValues.length > 0 && (
                      <tr className="border-b">
                        <th colSpan={rows.length + metrics.length} className="px-3 py-1.5" />
                        {data.colValues.map(cv => (
                          <th key={cv} colSpan={metrics.length}
                            className="border-l px-3 py-1.5 text-center font-bold text-foreground">
                            {cv}
                          </th>
                        ))}
                      </tr>
                    )}
                    <tr className="border-b">
                      {rows.map(d => (
                        <th key={d} onClick={() => clickSort('__dim')}
                          className="cursor-pointer whitespace-nowrap px-3 py-2 text-left font-semibold hover:text-primary">
                          {DIMENSIONS.find(x => x.id === d)?.label}
                          {sortBy === '__dim' && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                        </th>
                      ))}
                      {metrics.map(m => (
                        <th key={m} onClick={() => clickSort(m)}
                          className="cursor-pointer whitespace-nowrap px-3 py-2 text-right font-semibold hover:text-primary">
                          {METRICS.find(x => x.id === m)?.label}
                          {sortBy === m && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                        </th>
                      ))}
                      {data.colValues.flatMap(cv =>
                        metrics.map(m => (
                          <th key={`${cv}-${m}`} className="whitespace-nowrap border-l-0 px-3 py-2 text-right font-medium text-muted-foreground first-of-type:border-l">
                            {METRICS.find(x => x.id === m)?.label}
                          </th>
                        ))
                      )}
                    </tr>
                    {/* Totals row — FB Ads Manager style */}
                    <tr className="border-b bg-primary/[0.06] font-bold">
                      <td colSpan={rows.length} className="px-3 py-2">Totals</td>
                      {metrics.map(m => (
                        <td key={m} className="whitespace-nowrap px-3 py-2 text-right">
                          {fmt(data.totals[m] ?? 0, METRICS.find(x => x.id === m)?.money ?? false)}
                        </td>
                      ))}
                      {data.colValues.flatMap(cv => metrics.map(m => <td key={`${cv}-${m}`} />))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-accent/40 transition-colors">
                        {rows.map(d => (
                          <td key={d} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 font-medium">
                            {r.keys[d]}
                          </td>
                        ))}
                        {metrics.map(m => {
                          const v = r.metrics[m] ?? 0;
                          const max = maxByMetric[m] ?? 0;
                          const intensity = max > 0 ? v / max : 0;
                          return (
                            <td key={m} className="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                              style={{ backgroundColor: `rgba(124, 58, 237, ${(intensity * 0.18).toFixed(3)})` }}>
                              {fmt(v, METRICS.find(x => x.id === m)?.money ?? false)}
                            </td>
                          );
                        })}
                        {data.colValues.flatMap(cv =>
                          metrics.map(m => (
                            <td key={`${cv}-${m}`} className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {r.cells?.[cv] ? fmt(r.cells[cv]![m] ?? 0, METRICS.find(x => x.id === m)?.money ?? false) : '—'}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
