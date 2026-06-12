'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, ShoppingBag, Loader2, LayoutGrid, LineChart, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const rptApi = {
  getRevenue:     (period: string) => api.get('/advanced-reports/revenue', { params: { period } }).then(r => r.data.data),
  getTopProducts: ()               => api.get('/advanced-reports/top-products').then(r => r.data.data),
  getTopCustomers:()               => api.get('/advanced-reports/top-customers').then(r => r.data.data),
  getFunnel:      ()               => api.get('/advanced-reports/funnel').then(r => r.data.data),
  getCohort:      ()               => api.get('/advanced-reports/cohort').then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface DailyRevenue { date: string; revenue: number; orders: number; }
interface RevenueData  { period: string; totalRevenue: number; totalOrders: number; daily: DailyRevenue[]; }
interface TopProduct   { id: string; name: string; orderCount: number; unitsSold: number; revenue: number; }
interface TopCustomer  { id: string; firstName: string; lastName: string; email: string; orderCount: number; totalSpent: number; }
interface FunnelStep   { step: string; count: number; percent: number; }
interface CohortRow    { month: string; usersRegistered: number; ordersPlaced: number; }

const PERIODS = [
  { value: '7d',  label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y',  label: '1 Year' },
];

// ─── Tooltip ──────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue' ? `৳${Number(p.value).toLocaleString()}` : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

// ─── Quick-nav cards ──────────────────────────────────────────

const REPORT_LINKS = [
  { href: '/admin/advanced-reports/pivot', icon: LayoutGrid, label: 'Report Builder', desc: 'FB Ads-style pivot breakdown', color: 'bg-indigo-500' },
  { href: '/admin/advanced-reports/sales', icon: LineChart, label: 'Sales Analytics', desc: 'Revenue by channel, region & time', color: 'bg-green-500' },
  { href: '/admin/analytics/conversion',   icon: TrendingUp, label: 'Conversion Funnel', desc: 'Where customers drop off', color: 'bg-orange-500' },
  { href: '/admin/analytics/live-traffic', icon: BarChart3, label: 'Live Traffic', desc: 'Real-time visitor monitor', color: 'bg-blue-500' },
];

// ─── Main Page ────────────────────────────────────────────────

export default function AdvancedReportsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: revenue, isLoading: loadingRevenue } = useQuery<RevenueData>({
    queryKey: ['adv-revenue', period],
    queryFn: () => rptApi.getRevenue(period),
  });

  const { data: topProducts = [], isLoading: loadingProducts } = useQuery<TopProduct[]>({
    queryKey: ['adv-top-products'],
    queryFn: rptApi.getTopProducts,
  });

  const { data: topCustomers = [], isLoading: loadingCustomers } = useQuery<TopCustomer[]>({
    queryKey: ['adv-top-customers'],
    queryFn: rptApi.getTopCustomers,
  });

  const { data: funnel = [], isLoading: loadingFunnel } = useQuery<FunnelStep[]>({
    queryKey: ['adv-funnel'],
    queryFn: rptApi.getFunnel,
  });

  const { data: cohort = [], isLoading: loadingCohort } = useQuery<CohortRow[]>({
    queryKey: ['adv-cohort'],
    queryFn: rptApi.getCohort,
  });

  const dailyData = (revenue?.daily ?? []).slice(-30).map(d => ({
    date: d.date.slice(5),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const aov = revenue?.totalOrders
    ? Math.round((revenue.totalRevenue ?? 0) / revenue.totalOrders)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep analytics for your store</p>
        </div>
        <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p.value ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-nav */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {REPORT_LINKS.map(r => (
          <Link key={r.href} href={r.href}
            className="rounded-xl border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow group"
          >
            <div className={`w-8 h-8 rounded-lg ${r.color} flex items-center justify-center`}>
              <r.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors flex items-center gap-1">
                {r.label} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-muted-foreground leading-snug">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Total Revenue', value: loadingRevenue ? null : `৳${(revenue?.totalRevenue ?? 0).toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: ShoppingBag, label: 'Total Orders', value: loadingRevenue ? null : (revenue?.totalOrders ?? 0).toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: BarChart3, label: 'Avg Order Value', value: loadingRevenue ? null : `৳${aov.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Users, label: 'Top Customers', value: loadingCustomers ? null : topCustomers.length.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
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

      {/* Revenue + Orders chart (recharts) */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Revenue Trend
          </h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary/70 inline-block" />Revenue</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-400 inline-block" />Orders</span>
          </div>
        </div>
        {loadingRevenue ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : dailyData.length === 0 ? (
          <p className="text-center py-20 text-sm text-muted-foreground">No revenue data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="rev" tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<RevenueTooltip />} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line yAxisId="ord" type="monotone" dataKey="orders" name="orders" stroke="#f97316" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-orange-600" />
            <h2 className="font-bold">Top Products</h2>
          </div>
          {loadingProducts ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts.slice(0, 6).map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), revenue: p.revenue }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary) / 0.8)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 truncate text-xs">{p.name}</span>
                    <span className="font-semibold text-xs">৳{Number(p.revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Customers */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="font-bold">Top Customers</h2>
          </div>
          {loadingCustomers ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topCustomers.slice(0, 6).map(c => ({ name: c.firstName, spent: c.totalSpent }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'Spent']} />
                  <Bar dataKey="spent" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {topCustomers.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-700 flex-shrink-0">
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <span className="flex-1 truncate text-xs">{c.firstName} {c.lastName}</span>
                    <span className="font-semibold text-xs">৳{Number(c.totalSpent).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold">Conversion Funnel</h2>
          </div>
          {loadingFunnel ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500'];
                const c = colors[i % colors.length];
                return (
                  <div key={step.step}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{step.step}</span>
                      <span className="text-sm font-bold">{step.count.toLocaleString()}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div className={`h-full ${c} rounded-lg flex items-center pl-3 transition-all duration-500`}
                        style={{ width: `${Math.max(step.percent, 3)}%` }}>
                        <span className="text-xs text-white font-semibold">{step.percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Cohort */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold">Monthly Cohort</h2>
          </div>
          {loadingCohort ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : cohort.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={cohort.map(r => ({ month: r.month.slice(0, 7), users: r.usersRegistered, orders: r.ordersPlaced }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="users" name="New Users" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="orders" name="Orders" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 rounded-lg border overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Month</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">New Users</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Orders</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Conv%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cohort.slice(-6).map(row => (
                      <tr key={row.month} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono">{row.month.slice(0, 7)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.usersRegistered}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.ordersPlaced}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {row.usersRegistered > 0
                            ? `${Math.round((row.ordersPlaced / row.usersRegistered) * 100)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
