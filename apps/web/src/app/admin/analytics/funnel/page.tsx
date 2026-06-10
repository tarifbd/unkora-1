'use client';

import { useState } from 'react';
import { Filter, TrendingDown, Users, ShoppingCart, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';

const funnelSteps = [
  { step: 'Visitors', users: 24891, pct: 100, color: '#6366f1', icon: Users },
  { step: 'Product Views', users: 18234, pct: 73.2, color: '#8b5cf6', icon: Users },
  { step: 'Add to Cart', users: 6847, pct: 27.5, color: '#a78bfa', icon: ShoppingCart },
  { step: 'Checkout Start', users: 3421, pct: 13.7, color: '#f59e0b', icon: CreditCard },
  { step: 'Payment', users: 1876, pct: 7.5, color: '#f97316', icon: CreditCard },
  { step: 'Order Placed', users: 1543, pct: 6.2, color: '#10b981', icon: CheckCircle },
];

const dropoffReasons = [
  { reason: 'Left during product browsing', count: 6657, pct: 36 },
  { reason: 'Added to cart but abandoned', count: 3426, pct: 19 },
  { reason: 'Checkout form too complex', count: 1545, pct: 8 },
  { reason: 'Payment method not available', count: 1218, pct: 7 },
  { reason: 'High shipping cost', count: 983, pct: 5 },
];

const weeklyConversion = [
  { day: 'Mon', rate: 5.8 }, { day: 'Tue', rate: 6.2 }, { day: 'Wed', rate: 6.8 },
  { day: 'Thu', rate: 7.1 }, { day: 'Fri', rate: 8.4 }, { day: 'Sat', rate: 9.2 }, { day: 'Sun', rate: 7.6 },
];

export default function ConversionFunnelPage() {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Filter className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Conversion Funnel</h2>
            <p className="text-xs text-muted-foreground">Track where users drop off in the purchase journey</p>
          </div>
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-bold text-sm mb-6">Purchase Funnel — Last {period}</h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const drop = i > 0 ? ((funnelSteps[i - 1].users - step.users) / funnelSteps[i - 1].users * 100).toFixed(1) : null;
            return (
              <div key={step.step}>
                {drop && (
                  <div className="flex items-center gap-2 py-1 px-4">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-500 font-medium">{drop}% drop-off ({(funnelSteps[i-1].users - step.users).toLocaleString()} users left)</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-32 text-right">
                    <p className="text-sm font-semibold">{step.step}</p>
                    <p className="text-xs text-muted-foreground">{step.users.toLocaleString()} users</p>
                  </div>
                  <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg flex items-center pl-4 transition-all duration-500"
                      style={{ width: `${step.pct}%`, background: step.color }}
                    >
                      <span className="text-white text-xs font-bold">{step.pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall conversion */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-indigo-600">6.2%</p>
            <p className="text-xs text-muted-foreground">Overall Conversion Rate</p>
          </div>
          <div>
            <p className="text-2xl font-black text-green-600">৳2,14,000</p>
            <p className="text-xs text-muted-foreground">Revenue Captured</p>
          </div>
          <div>
            <p className="text-2xl font-black text-orange-600">৳1,83,000</p>
            <p className="text-xs text-muted-foreground">Abandoned Cart Value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop-off reasons */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Top Drop-off Reasons
          </h3>
          <div className="space-y-3">
            {dropoffReasons.map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sm">{r.reason}</span>
                  <span className="font-bold text-red-500">{r.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${r.pct * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly conversion rate */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Daily Conversion Rate This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyConversion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Conversion Rate">
                {weeklyConversion.map((entry, i) => (
                  <Cell key={i} fill={entry.rate >= 8 ? '#10b981' : entry.rate >= 6.5 ? '#6366f1' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Friday & Saturday have highest conversion — ideal for flash deals
          </p>
        </div>
      </div>
    </div>
  );
}
