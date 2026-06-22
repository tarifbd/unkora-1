'use client';

import { useState } from 'react';
import { Package, TrendingUp, TrendingDown, Star, Eye, ShoppingCart, BarChart3, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const mockProducts = [
  { id: 1, name: 'নবীদের গল্প', category: 'Islamic', views: 4821, orders: 312, revenue: 93600, rating: 4.8, stock: 142, trend: 'up' },
  { id: 2, name: 'হুমায়ূন সমগ্র', category: 'Fiction', views: 3934, orders: 287, revenue: 172200, rating: 4.9, stock: 78, trend: 'up' },
  { id: 3, name: 'SSC Physics Guide', category: 'Academic', views: 3201, orders: 241, revenue: 96400, rating: 4.6, stock: 234, trend: 'up' },
  { id: 4, name: 'রবীন্দ্র রচনাবলী', category: 'Literature', views: 2741, orders: 198, revenue: 138600, rating: 4.7, stock: 56, trend: 'down' },
  { id: 5, name: 'Atomic Habits (Bengali)', category: 'Self-Help', views: 2314, orders: 176, revenue: 79200, rating: 4.5, stock: 189, trend: 'up' },
  { id: 6, name: 'HSC Chemistry', category: 'Academic', views: 1987, orders: 154, revenue: 61600, rating: 4.4, stock: 312, trend: 'stable' },
  { id: 7, name: 'পথের পাঁচালী', category: 'Literature', views: 1654, orders: 132, revenue: 52800, rating: 4.8, stock: 201, trend: 'up' },
  { id: 8, name: 'Quran Sharif (Large)', category: 'Islamic', views: 1432, orders: 118, revenue: 94400, rating: 4.9, stock: 34, trend: 'down' },
];

const categoryPerf = [
  { category: 'Academic', revenue: 284000, orders: 891, margin: 38 },
  { category: 'Fiction', revenue: 198000, orders: 634, margin: 42 },
  { category: 'Islamic', revenue: 176000, orders: 512, margin: 35 },
  { category: 'Literature', revenue: 143000, orders: 421, margin: 44 },
  { category: 'Self-Help', revenue: 98000, orders: 312, margin: 40 },
  { category: 'Children\'s', revenue: 87000, orders: 298, margin: 36 },
];

const trendData = [
  { month: 'Jan', top: 312, low: 89 },
  { month: 'Feb', top: 341, low: 76 },
  { month: 'Mar', top: 398, low: 82 },
  { month: 'Apr', top: 421, low: 71 },
  { month: 'May', top: 456, low: 68 },
  { month: 'Jun', top: 489, low: 63 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f97316', '#ec4899', '#14b8a6'];

export default function ProductAnalyticsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'orders' | 'revenue' | 'views'>('orders');
  const [period, setPeriod] = useState('30d');

  const filtered = mockProducts
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Product Performance Analytics</h2>
            <p className="text-xs text-muted-foreground">Track views, conversions, and revenue per product</p>
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
          { label: 'Total Products', value: '1,284', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Avg View-to-Order', value: '8.4%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Best Rated', value: '4.76★', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Low Stock Items', value: '23', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${k.bg} rounded-lg p-2 w-fit mb-2`}><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <p className="text-xl font-black">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category performance */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                {categoryPerf.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Top vs Low Performers — Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="top" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Top 10" />
              <Line type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Bottom 10" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-3 py-2 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border rounded-lg px-3 py-2 bg-transparent"
          >
            <option value="orders">Sort by Orders</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="views">Sort by Views</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-center">Rating</th>
                <th className="px-5 py-3 text-center">Stock</th>
                <th className="px-5 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium">{p.name}</p>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>
                  </td>
                  <td className="px-5 py-3 text-right">{p.views.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-semibold">{p.orders.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-bold text-green-600">৳{p.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                      <Star className="h-3 w-3 fill-current" />{p.rating}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-semibold ${p.stock < 50 ? 'text-red-500' : 'text-gray-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500 mx-auto" /> :
                     p.trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-400 mx-auto" /> :
                     <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
