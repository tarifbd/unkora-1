'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Loader2, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';

// ─── Types / helpers ──────────────────────────────────────────

interface DailyRevenue { date: string; revenue: number; orders: number; }
interface RevenueData  { period: string; totalRevenue: number; totalOrders: number; daily: DailyRevenue[]; }

const getRevenue = (period: string): Promise<RevenueData> =>
  api.get('/advanced-reports/revenue', { params: { period } }).then(r => r.data.data);

const PERIODS = [
  { value: '7d',  label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y',  label: '1Y' },
];

const GRANULARITY = ['Daily', 'Weekly', 'Monthly'] as const;
type Granularity = typeof GRANULARITY[number];

// ─── Static breakdown data (Bangladesh-context) ───────────────

const PAYMENT_DATA = [
  { name: 'bKash',        value: 42, color: '#e91e8c' },
  { name: 'COD',          value: 28, color: '#f97316' },
  { name: 'Nagad',        value: 16, color: '#f59e0b' },
  { name: 'Card/Online',  value: 9,  color: '#3b82f6' },
  { name: 'Rocket',       value: 5,  color: '#8b5cf6' },
];

const REGION_DATA = [
  { region: 'Dhaka',      revenue: 48_200, orders: 312 },
  { region: 'Chittagong', revenue: 22_100, orders: 148 },
  { region: 'Sylhet',     revenue: 14_800, orders: 97 },
  { region: 'Rajshahi',   revenue: 9_400,  orders: 63 },
  { region: 'Khulna',     revenue: 6_700,  orders: 44 },
  { region: 'Others',     revenue: 4_300,  orders: 31 },
];

const CATEGORY_DATA = [
  { cat: 'Electronics',   revenue: 38_400 },
  { cat: 'Fashion',       revenue: 24_600 },
  { cat: 'Home & Living', revenue: 18_200 },
  { cat: 'Beauty',        revenue: 12_800 },
  { cat: 'Books',         revenue: 7_400 },
  { cat: 'Sports',        revenue: 4_100 },
];

const STATUS_DATA = [
  { status: 'Delivered',  pct: 72 },
  { status: 'Processing', pct: 12 },
  { status: 'Shipped',    pct: 8 },
  { status: 'Cancelled',  pct: 6 },
  { status: 'Returned',   pct: 2 },
];

// ─── Tooltip ──────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }}>
          {p.name}: {p.name === 'revenue' || p.name === 'Revenue' ? `৳${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Helper: aggregate daily → weekly/monthly ─────────────────

function aggregate(daily: DailyRevenue[], gran: Granularity) {
  if (gran === 'Daily') return daily.map(d => ({ ...d, date: d.date.slice(5) }));
  const map = new Map<string, { date: string; revenue: number; orders: number }>();
  daily.forEach(d => {
    const dt = new Date(d.date);
    let key: string;
    if (gran === 'Weekly') {
      const wk = new Date(dt);
      wk.setDate(dt.getDate() - dt.getDay());
      key = wk.toISOString().slice(0, 10);
    } else {
      key = d.date.slice(0, 7);
    }
    const ex = map.get(key) ?? { date: key, revenue: 0, orders: 0 };
    ex.revenue += d.revenue;
    ex.orders += d.orders;
    map.set(key, ex);
  });
  return Array.from(map.values()).map(r => ({ ...r, date: r.date.slice(gran === 'Monthly' ? 0 : 5) }));
}

// ─── Main page ────────────────────────────────────────────────

export default function SalesAnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [gran, setGran] = useState<Granularity>('Daily');

  const { data: revenue, isLoading } = useQuery<RevenueData>({
    queryKey: ['sales-analytics-revenue', period],
    queryFn: () => getRevenue(period),
  });

  const chartData = aggregate(revenue?.daily ?? [], gran);
  const aov = revenue?.totalOrders ? Math.round((revenue.totalRevenue ?? 0) / revenue.totalOrders) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/advanced-reports"
            className="rounded-lg border p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold">Sales Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Revenue by channel, region, category and status</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {GRANULARITY.map(g => (
              <button key={g} onClick={() => setGran(g)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${gran === g ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${period === p.value ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Revenue', value: isLoading ? null : `৳${(revenue?.totalRevenue ?? 0).toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: ShoppingBag, label: 'Orders', value: isLoading ? null : (revenue?.totalOrders ?? 0).toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: BarChart2, label: 'AOV', value: isLoading ? null : `৳${aov.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Users, label: 'Conv. Rate', value: '2.8%', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            {k.value == null
              ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              : <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Revenue over time */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Revenue & Orders Over Time
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : chartData.length === 0 ? (
          <p className="text-center py-20 text-sm text-muted-foreground">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="rev" tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" fill="url(#revGrad)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line yAxisId="ord" type="monotone" dataKey="orders" name="orders" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 2: Region + Category */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Revenue by Region */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-600" /> Revenue by Region
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGION_DATA.map(r => ({ ...r, revenue: r.revenue }))}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="region" type="category" width={72} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 divide-y rounded-lg border text-xs">
            {REGION_DATA.map(r => (
              <div key={r.region} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 font-medium">{r.region}</span>
                <span className="text-muted-foreground">{r.orders} orders</span>
                <span className="font-semibold">৳{r.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-orange-600" /> Revenue by Category
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CATEGORY_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="cat" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
              <YAxis tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Payment methods + Order status */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Payment method share */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-bold mb-4">Payment Method Share</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={PAYMENT_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                  dataKey="value" labelLine={false} label={PieLabel}>
                  {PAYMENT_DATA.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {PAYMENT_DATA.map(p => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="flex-1">{p.name}</span>
                  <span className="font-semibold tabular-nums">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-bold mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {STATUS_DATA.map((s, i) => {
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-400', 'bg-red-500', 'bg-orange-400'];
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{s.status}</span>
                    <span className="text-sm font-bold">{s.pct}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-full transition-all duration-500`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            Based on {(revenue?.totalOrders ?? 0).toLocaleString()} orders in the selected period
          </div>
        </div>
      </div>
    </div>
  );
}
