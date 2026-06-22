'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp, Users, MousePointerClick, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

const FUNNEL_STEPS = [
  { step: 'Visitors', count: 48_320, icon: Users, color: 'bg-blue-500', drop: null },
  { step: 'Product Views', count: 18_540, icon: MousePointerClick, color: 'bg-indigo-500', drop: 61.6 },
  { step: 'Add to Cart', count: 4_210, icon: ShoppingCart, color: 'bg-violet-500', drop: 77.3 },
  { step: 'Checkout Started', count: 1_890, icon: CreditCard, color: 'bg-purple-500', drop: 55.1 },
  { step: 'Order Placed', count: 1_247, icon: CheckCircle, color: 'bg-green-500', drop: 34.0 },
];

const DEVICE_FUNNEL = [
  { device: 'Mobile', visitors: 32_780, orders: 712, rate: '2.17%' },
  { device: 'Desktop', visitors: 11_550, orders: 421, rate: '3.64%' },
  { device: 'Tablet', visitors: 3_990, orders: 114, rate: '2.86%' },
];

const EXIT_PAGES = [
  { page: 'Checkout — Shipping', exits: 421, rate: '22.3%' },
  { page: 'Checkout — Payment', exits: 318, rate: '16.8%' },
  { page: 'Cart', exits: 297, rate: '15.7%' },
  { page: 'Product Page', exits: 244, rate: '12.9%' },
  { page: 'Account Login', exits: 189, rate: '10.0%' },
];

export default function ConversionPage() {
  const [period, setPeriod] = useState('Last 30 days');
  const maxCount = FUNNEL_STEPS[0]?.count ?? 1;
  const overallRate = (((FUNNEL_STEPS[4]?.count ?? 0) / maxCount) * 100).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Conversion Funnel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Understand where customers drop off in the buying journey</p>
        </div>
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overall rate */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Overall Conv. Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{overallRate}%</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" /> +0.3% vs prev period
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Visitors</p>
          <p className="text-2xl font-bold mt-1">48.3K</p>
          <p className="text-xs text-muted-foreground mt-1">total sessions</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-2xl font-bold mt-1">1,247</p>
          <p className="text-xs text-muted-foreground mt-1">completed</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Avg. Revenue / Visitor</p>
          <p className="text-2xl font-bold mt-1">৳82.4</p>
          <p className="text-xs text-muted-foreground mt-1">rev per session</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Funnel visualization */}
        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="border-b px-5 py-3.5">
            <span className="font-semibold text-sm">Purchase Funnel</span>
          </div>
          <div className="p-5 space-y-3">
            {FUNNEL_STEPS.map((step, i) => {
              const width = (step.count / maxCount) * 100;
              return (
                <div key={step.step}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <step.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{step.step}</span>
                    <span className="text-sm font-semibold tabular-nums">{step.count.toLocaleString()}</span>
                    {step.drop !== null && (
                      <span className="text-xs text-red-500 flex items-center gap-0.5 w-16 text-right">
                        <TrendingDown className="h-3 w-3" />-{step.drop}%
                      </span>
                    )}
                  </div>
                  <div className="h-9 rounded-lg bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-lg ${step.color} flex items-center justify-end pr-3 transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs text-white font-semibold">{((step.count / maxCount) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {i < FUNNEL_STEPS.length - 1 && (
                    <div className="mt-1 ml-7 text-xs text-muted-foreground">
                      {(FUNNEL_STEPS[i + 1]?.count ?? 0).toLocaleString()} of {step.count.toLocaleString()} continued →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          {/* Device breakdown */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-3.5">
              <span className="font-semibold text-sm">Conversion by Device</span>
            </div>
            <div className="divide-y">
              {DEVICE_FUNNEL.map(d => (
                <div key={d.device} className="px-5 py-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{d.device}</span>
                    <span className="text-sm font-bold text-green-600">{d.rate}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{d.visitors.toLocaleString()} visitors</span>
                    <span>{d.orders.toLocaleString()} orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top exit pages */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-3.5">
              <span className="font-semibold text-sm">Top Exit Pages</span>
            </div>
            <div className="divide-y">
              {EXIT_PAGES.map(e => (
                <div key={e.page} className="px-5 py-2.5 flex items-center justify-between gap-2">
                  <p className="text-xs truncate flex-1">{e.page}</p>
                  <span className="text-xs font-medium text-red-500 flex-shrink-0">{e.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
