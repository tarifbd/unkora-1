'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, ShoppingBag, Users, Eye, Star } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';

const MONTHLY = [
  { m: 'জানু', rev: 28000, orders: 42 }, { m: 'ফেব্রু', rev: 35000, orders: 54 },
  { m: 'মার্চ', rev: 31000, orders: 48 }, { m: 'এপ্রি', rev: 42000, orders: 65 },
  { m: 'মে',   rev: 38000, orders: 58 }, { m: 'জুন',  rev: 51000, orders: 79 },
];

const TOP_PRODUCTS = [
  { name: 'Python Programming',     rev: 18750 },
  { name: 'বাংলাদেশের ইতিহাস',      rev: 12600 },
  { name: 'English Grammar in Use', rev: 9800  },
  { name: 'Data Structures',        rev: 8400  },
  { name: 'রবীন্দ্র রচনাবলী',       rev: 7200  },
];

const PAYMENT_PIE = [
  { name: 'bKash',  value: 44, color: '#e91e8c' },
  { name: 'COD',    value: 29, color: '#f59e0b' },
  { name: 'Nagad',  value: 18, color: '#10b981' },
  { name: 'কার্ড',  value: 9,  color: '#6366f1' },
];

const STATS = [
  { label: 'মোট আয়',      value: '৳2,25,000', change: +18, icon: TrendingUp,  color: 'text-green-600 bg-green-50'  },
  { label: 'মোট অর্ডার',  value: '346',        change: +12, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50'   },
  { label: 'পেজ ভিউ',     value: '14,200',      change: +8,  icon: Eye,         color: 'text-purple-600 bg-purple-50'},
  { label: 'গড় রেটিং',   value: '4.7 ★',      change: +0.2,icon: Star,        color: 'text-amber-600 bg-amber-50'  },
];

export default function SellerAnalyticsPage() {
  const [gran, setGran] = useState<'monthly' | 'weekly'>('monthly');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">বিক্রয় বিশ্লেষণ</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার শপের পারফরম্যান্স ট্র্যাক করুন</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['monthly', 'weekly'] as const).map(g => (
            <button key={g} onClick={() => setGran(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gran === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {g === 'monthly' ? 'মাসিক' : 'সাপ্তাহিক'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${s.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {s.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change > 0 ? '+' : ''}{s.change}%
                </span>
              </div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">মাসিক আয়</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary, #10b981)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary, #10b981)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'আয়']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">সেরা পণ্য</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, 'আয়']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="rev" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">পেমেন্ট পদ্ধতি</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PAYMENT_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {PAYMENT_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">গ্রাহক পরিসংখ্যান</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'মোট গ্রাহক',  value: '234',   icon: Users },
            { label: 'নতুন এই মাসে', value: '48',    icon: TrendingUp },
            { label: 'পুনরায় ক্রয়', value: '38%',   icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <p className="text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
