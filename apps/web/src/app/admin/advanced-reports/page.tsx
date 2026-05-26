'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const rptApi = {
  getRevenue: (period: string) => api.get('/advanced-reports/revenue', { params: { period } }).then(r => r.data.data),
  getTopProducts: () => api.get('/advanced-reports/top-products').then(r => r.data.data),
  getTopCustomers: () => api.get('/advanced-reports/top-customers').then(r => r.data.data),
  getFunnel: () => api.get('/advanced-reports/funnel').then(r => r.data.data),
  getCohort: () => api.get('/advanced-reports/cohort').then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface DailyRevenue { date: string; revenue: number; orders: number; }
interface RevenueData { period: string; totalRevenue: number; totalOrders: number; daily: DailyRevenue[]; }
interface TopProduct { id: string; name: string; orderCount: number; unitsSold: number; revenue: number; }
interface TopCustomer { id: string; firstName: string; lastName: string; email: string; orderCount: number; totalSpent: number; }
interface FunnelStep { step: string; count: number; percent: number; }
interface CohortRow { month: string; usersRegistered: number; ordersPlaced: number; }

// ─── Period Selector ──────────────────────────────────────────

const PERIODS = [
  { value: '7d',  label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y',  label: '1 Year' },
];

// ─── CSS Bar Chart ────────────────────────────────────────────

function CssBarChart({ data }: { data: DailyRevenue[] }) {
  if (!data.length) return <p className="text-center text-sm text-muted-foreground py-8">No data for this period</p>;

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="space-y-1">
      {data.slice(-20).map(d => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="w-20 flex-shrink-0 text-right text-xs text-muted-foreground">{d.date.slice(5)}</span>
          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded transition-all duration-300 flex items-center justify-end pr-1.5"
              style={{ width: `${(d.revenue / maxRevenue) * 100}%`, minWidth: d.revenue > 0 ? '4px' : '0' }}
            >
              {d.revenue > 1000 && (
                <span className="text-[10px] text-white font-semibold">৳{(d.revenue / 1000).toFixed(1)}k</span>
              )}
            </div>
          </div>
          <span className="w-8 text-xs text-muted-foreground text-right">{d.orders}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t">
        <span className="w-20 text-right text-xs font-semibold text-muted-foreground">Date</span>
        <span className="flex-1 text-xs text-muted-foreground">Revenue</span>
        <span className="w-8 text-xs font-semibold text-muted-foreground text-right">Ord.</span>
      </div>
    </div>
  );
}

// ─── Funnel ───────────────────────────────────────────────────

function FunnelViz({ steps }: { steps: FunnelStep[] }) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500'];
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={step.step}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{step.step}</span>
            <span className="text-sm font-bold">{step.count.toLocaleString()}</span>
          </div>
          <div className="h-8 bg-muted rounded-lg overflow-hidden">
            <div
              className={`h-full ${colors[i] ?? 'bg-gray-500'} rounded-lg flex items-center pl-3 transition-all duration-500`}
              style={{ width: `${Math.max(step.percent, 3)}%` }}
            >
              <span className="text-xs text-white font-semibold">{step.percent}%</span>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex justify-start pl-4 py-0.5">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep analytics for your store</p>
        </div>
        <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p.value
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Revenue</span>
          </div>
          {loadingRevenue ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold">৳{(revenue?.totalRevenue ?? 0).toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">Last {PERIODS.find(p => p.value === period)?.label}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Orders</span>
          </div>
          {loadingRevenue ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold">{(revenue?.totalOrders ?? 0).toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">Non-cancelled</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Revenue Trend</h2>
          <span className="text-xs text-muted-foreground">(bars = revenue, numbers = orders)</span>
        </div>
        {loadingRevenue ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <CssBarChart data={revenue?.daily ?? []} />
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
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.unitsSold} units · {p.orderCount} orders</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0">৳{Number(p.revenue).toLocaleString()}</span>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
            </div>
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
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">৳{Number(c.totalSpent).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{c.orderCount} orders</p>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
            </div>
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
          ) : (
            <FunnelViz steps={funnel} />
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
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Month</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">New Users</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Conv%</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cohort.map(row => (
                    <tr key={row.month} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{row.month}</td>
                      <td className="px-3 py-2 text-right">{row.usersRegistered}</td>
                      <td className="px-3 py-2 text-right">{row.ordersPlaced}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {row.usersRegistered > 0
                          ? `${Math.round((row.ordersPlaced / row.usersRegistered) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {cohort.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-xs">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
