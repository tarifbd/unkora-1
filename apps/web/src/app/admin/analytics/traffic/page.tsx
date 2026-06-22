'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, Globe, Monitor, Smartphone, Tablet, ArrowUp, ArrowDown, Eye, Clock, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const generateTrafficData = () => Array.from({ length: 30 }, (_, i) => ({
  time: `${i}m ago`,
  visitors: Math.floor(Math.random() * 80) + 20,
  pageviews: Math.floor(Math.random() * 200) + 80,
})).reverse();

const topPages = [
  { page: '/', title: 'Home', views: 4821, sessions: 3201, bounce: '42%', duration: '2m 14s' },
  { page: '/books', title: 'Books', views: 2934, sessions: 1876, bounce: '38%', duration: '3m 42s' },
  { page: '/books/history', title: 'History Books', views: 1823, sessions: 1204, bounce: '44%', duration: '2m 58s' },
  { page: '/books/fiction', title: 'Fiction', views: 1541, sessions: 987, bounce: '51%', duration: '1m 32s' },
  { page: '/account/orders', title: 'My Orders', views: 934, sessions: 712, bounce: '28%', duration: '4m 12s' },
];

const liveUsers = [
  { country: 'Bangladesh', flag: '🇧🇩', users: 142, pct: 68 },
  { country: 'India', flag: '🇮🇳', users: 38, pct: 18 },
  { country: 'USA', flag: '🇺🇸', users: 14, pct: 7 },
  { country: 'UK', flag: '🇬🇧', users: 9, pct: 4 },
  { country: 'Other', flag: '🌐', users: 6, pct: 3 },
];

export default function TrafficMonitorPage() {
  const [data, setData] = useState(generateTrafficData());
  const [liveCount, setLiveCount] = useState(209);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateTrafficData());
      setLiveCount(prev => prev + Math.floor(Math.random() * 5) - 2);
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Live Users', value: liveCount, icon: Wifi, color: 'text-green-500', bg: 'bg-green-50', change: '+12%', up: true },
    { label: "Today's Sessions", value: '8,412', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', change: '+8%', up: true },
    { label: 'Page Views', value: '24,891', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', change: '+15%', up: true },
    { label: 'Avg. Duration', value: '2m 48s', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', change: '-3%', up: false },
  ];

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-sm font-semibold text-green-600">LIVE — updates every 5 seconds</span>
        <span className="text-xs text-muted-foreground ml-auto">Tick #{tick}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`${s.bg} rounded-lg p-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <span className={`text-xs font-semibold flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                {s.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Real-time Traffic (last 30 minutes)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} fill="url(#gVisitors)" name="Visitors" />
              <Area type="monotone" dataKey="pageviews" stroke="#10b981" strokeWidth={2} fill="none" name="Page Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By country */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Live Users by Country</h3>
          <div className="space-y-3">
            {liveUsers.map(c => (
              <div key={c.country}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm flex items-center gap-2">{c.flag} {c.country}</span>
                  <span className="text-xs font-bold">{c.users}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
            <div>
              <Monitor className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs font-bold">56%</p>
              <p className="text-[10px] text-muted-foreground">Desktop</p>
            </div>
            <div>
              <Smartphone className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-xs font-bold">39%</p>
              <p className="text-[10px] text-muted-foreground">Mobile</p>
            </div>
            <div>
              <Tablet className="h-4 w-4 mx-auto text-purple-500 mb-1" />
              <p className="text-xs font-bold">5%</p>
              <p className="text-[10px] text-muted-foreground">Tablet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-bold text-sm">Top Pages — Today</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Page</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3 text-right">Sessions</th>
                <th className="px-5 py-3 text-right">Bounce</th>
                <th className="px-5 py-3 text-right">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topPages.map(p => (
                <tr key={p.page} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.page}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{p.views.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">{p.sessions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-orange-600">{p.bounce}</td>
                  <td className="px-5 py-3 text-right">{p.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
