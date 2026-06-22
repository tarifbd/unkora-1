'use client';

import { useState } from 'react';
import { Activity, Search, Clock, RefreshCw, ArrowRight, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const sessionFlows = [
  { from: 'Home', to: 'Books', count: 4821, pct: 42 },
  { from: 'Home', to: 'Search', count: 2934, pct: 26 },
  { from: 'Books', to: 'Book Detail', count: 6234, pct: 71 },
  { from: 'Book Detail', to: 'Cart', count: 2841, pct: 46 },
  { from: 'Search', to: 'Book Detail', count: 1923, pct: 65 },
  { from: 'Cart', to: 'Checkout', count: 1654, pct: 58 },
];

const searchTerms = [
  { term: 'হুমায়ূন আহমেদ', count: 1923 },
  { term: 'ইসলামিক বই', count: 1541 },
  { term: 'SSC guide', count: 1203 },
  { term: 'children story', count: 987 },
  { term: 'রবীন্দ্রনাথ', count: 876 },
  { term: 'HSC book', count: 743 },
  { term: 'motivational', count: 612 },
];

const sessionLength = [
  { range: '0–1 min', count: 3201, color: '#ef4444' },
  { range: '1–3 min', count: 4812, color: '#f97316' },
  { range: '3–5 min', count: 2934, color: '#f59e0b' },
  { range: '5–10 min', count: 1876, color: '#10b981' },
  { range: '10+ min', count: 987, color: '#6366f1' },
];

const returnBehavior = [
  { name: 'First Visit', value: 55 },
  { name: 'Returning (2-5)', value: 28 },
  { name: 'Loyal (6+)', value: 17 },
];
const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  sessions: h >= 9 && h <= 22 ? Math.floor(150 + Math.sin((h - 9) * 0.4) * 100 + Math.random() * 40) : Math.floor(10 + Math.random() * 20),
}));

export default function BehavioralAnalyticsPage() {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Activity className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Behavioral Analytics</h2>
            <p className="text-xs text-muted-foreground">Understand how users navigate and interact with your store</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pages/Session', value: '4.2', sub: '+0.3 vs last period' },
          { label: 'Avg Session Duration', value: '4m 18s', sub: '+12% vs last period' },
          { label: 'Bounce Rate', value: '38.4%', sub: '-2.1% vs last period' },
          { label: 'Return Rate', value: '45%', sub: '+5% vs last period' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-2xl font-black text-foreground">{k.value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{k.label}</p>
            <p className="text-[11px] text-green-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly activity */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" /> Peak Activity Hours
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyActivity}>
              <defs>
                <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="sessions" stroke="#f97316" strokeWidth={2} fill="url(#gAct)" name="Sessions" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-muted-foreground mt-2">Peak hours: 8 PM – 11 PM</p>
        </div>

        {/* Return behavior */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">User Return Behavior</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={returnBehavior} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {returnBehavior.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {returnBehavior.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <div>
                    <p className="text-xs font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User flow */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-500" /> Top Navigation Flows
          </h3>
          <div className="space-y-2.5">
            {sessionFlows.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-muted-foreground w-20 text-right truncate">{f.from}</span>
                <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="font-medium w-24 truncate">{f.to}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${f.pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search terms */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-purple-500" /> Top Search Terms
          </h3>
          <div className="space-y-2">
            {searchTerms.map((t, i) => (
              <div key={t.term} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="flex-1 text-sm">{t.term}</span>
                <span className="text-xs font-bold">{t.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session length distribution */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4">Session Duration Distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sessionLength}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
              {sessionLength.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
