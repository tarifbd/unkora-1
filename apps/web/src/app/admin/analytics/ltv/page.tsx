'use client';

import { useState } from 'react';
import { DollarSign, Users, TrendingUp, Heart, Star, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const ltvCohorts = [
  { cohort: 'Jan 2024', month1: 1200, month3: 2800, month6: 4900, month12: 8200 },
  { cohort: 'Apr 2024', month1: 1450, month3: 3200, month6: 5600, month12: 9100 },
  { cohort: 'Jul 2024', month1: 1680, month3: 3800, month6: 6400, month12: null },
  { cohort: 'Oct 2024', month1: 1920, month3: 4100, month6: null, month12: null },
  { cohort: 'Jan 2025', month1: 2100, month3: null, month6: null, month12: null },
];

const segmentLTV = [
  { segment: 'Champions', count: 342, avgLTV: 24800, color: '#6366f1', icon: Crown },
  { segment: 'Loyal', count: 891, avgLTV: 12400, color: '#10b981', icon: Heart },
  { segment: 'Potential', count: 2341, avgLTV: 5600, color: '#f59e0b', icon: Star },
  { segment: 'At Risk', count: 1234, avgLTV: 2800, color: '#f97316', icon: Users },
  { segment: 'Lost', count: 4512, avgLTV: 890, color: '#ef4444', icon: Users },
];

const ltvByCategory = [
  { category: 'Academic', ltv: 18400 },
  { category: 'Professional', ltv: 15200 },
  { category: 'Fiction', ltv: 9800 },
  { category: 'Children\'s', ltv: 8400 },
  { category: 'Self-Help', ltv: 7200 },
  { category: 'Religious', ltv: 6800 },
];

const retentionData = [
  { month: 'M0', rate: 100 },
  { month: 'M1', rate: 58 },
  { month: 'M2', rate: 42 },
  { month: 'M3', rate: 34 },
  { month: 'M6', rate: 26 },
  { month: 'M9', rate: 21 },
  { month: 'M12', rate: 18 },
];

export default function CustomerLTVPage() {
  const [view, setView] = useState<'cohort' | 'segment'>('cohort');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Customer Lifetime Value (LTV)</h2>
            <p className="text-xs text-muted-foreground">Understand the long-term value of your customer base</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg LTV (All)', value: '৳8,420', change: '+18%', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Avg LTV (12-month)', value: '৳12,800', change: '+22%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Retention Rate (M3)', value: '34%', change: '+4%', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
          { label: 'Champion Customers', value: '342', change: '+28 new', icon: Crown, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${k.bg} rounded-lg p-2 w-fit mb-2`}><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <p className="text-xl font-black">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-[11px] text-green-600 mt-1">{k.change} vs prev period</p>
          </div>
        ))}
      </div>

      {/* Segments */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-bold text-sm">Customer Segments by LTV</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x">
          {segmentLTV.map(s => (
            <div key={s.segment} className="p-5 text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <p className="font-bold text-sm">{s.segment}</p>
              <p className="text-2xl font-black mt-1" style={{ color: s.color }}>
                {s.count.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">customers</p>
              <p className="text-sm font-semibold mt-1">৳{s.avgLTV.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">avg LTV</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort LTV */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">LTV by Cohort (Cumulative)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ltvCohorts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cohort" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => v ? `৳${v.toLocaleString()}` : 'N/A'} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="month1" fill="#c7d2fe" name="Month 1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="month3" fill="#818cf8" name="Month 3" radius={[2, 2, 0, 0]} />
              <Bar dataKey="month6" fill="#6366f1" name="Month 6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="month12" fill="#4338ca" name="Month 12" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention curve */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Customer Retention Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={retentionData}>
              <defs>
                <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#gRet)" name="Retention %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* LTV by category */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Average LTV by Book Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ltvByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="ltv" fill="#6366f1" radius={[0, 4, 4, 0]} name="Avg LTV" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
