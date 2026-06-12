'use client';

import { useEffect, useState } from 'react';
import { Activity, Globe, Monitor, Smartphone, Tablet, Users, Eye, ShoppingCart, TrendingUp } from 'lucide-react';

const PAGES = [
  { path: '/', title: 'Homepage', views: 47, sessions: 38 },
  { path: '/products', title: 'Products', views: 31, sessions: 28 },
  { path: '/categories/electronics', title: 'Electronics', views: 22, sessions: 19 },
  { path: '/products/iphone-15', title: 'iPhone 15 Pro', views: 18, sessions: 15 },
  { path: '/checkout', title: 'Checkout', views: 12, sessions: 12 },
  { path: '/categories/fashion', title: 'Fashion', views: 11, sessions: 9 },
  { path: '/products/samsung-s24', title: 'Samsung S24', views: 9, sessions: 8 },
  { path: '/cart', title: 'Cart', views: 8, sessions: 8 },
];

const SOURCES = [
  { source: 'Direct', visitors: 38, color: 'bg-blue-500' },
  { source: 'Google', visitors: 29, color: 'bg-red-500' },
  { source: 'Facebook', visitors: 18, color: 'bg-indigo-500' },
  { source: 'WhatsApp', visitors: 12, color: 'bg-green-500' },
  { source: 'Instagram', visitors: 9, color: 'bg-pink-500' },
  { source: 'Others', visitors: 6, color: 'bg-gray-400' },
];

const LOCATIONS = [
  { city: 'Dhaka', visitors: 52, flag: '🏙️' },
  { city: 'Chittagong', visitors: 21, flag: '🌊' },
  { city: 'Sylhet', visitors: 14, flag: '🍵' },
  { city: 'Rajshahi', visitors: 9, flag: '🌾' },
  { city: 'Khulna', visitors: 7, flag: '🌿' },
  { city: 'Barisal', visitors: 4, flag: '⚓' },
  { city: 'Comilla', visitors: 4, flag: '🏛️' },
  { city: 'Others', visitors: 1, flag: '🗺️' },
];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function LiveTrafficPage() {
  const [activeVisitors, setActiveVisitors] = useState(112);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisitors(v => v + Math.floor(Math.random() * 5) - 2);
      setPulse(p => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalSources = SOURCES.reduce((s, r) => s + r.visitors, 0);
  const totalLocations = LOCATIONS.reduce((s, r) => s + r.visitors, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Live Traffic</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time visitor activity on your store</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium">
          <span className={`h-2.5 w-2.5 rounded-full bg-green-500 ${pulse ? 'opacity-100' : 'opacity-40'} transition-opacity duration-700`} />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Active Visitors" value={activeVisitors} sub="right now" color="bg-green-500" />
        <StatCard icon={Eye} label="Page Views (1hr)" value="1,847" sub="+12% vs last hour" color="bg-blue-500" />
        <StatCard icon={ShoppingCart} label="Carts Active" value={14} sub="in checkout" color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Conv. Rate (live)" value="3.2%" sub="last 30 min" color="bg-purple-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Active Pages */}
        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="border-b px-5 py-3.5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Active Pages</span>
          </div>
          <div className="divide-y">
            {PAGES.map(p => (
              <div key={p.path} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.path}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{p.views}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                  <div className="w-20">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${(p.views / PAGES[0].views) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Traffic Sources */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-3.5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Traffic Sources</span>
            </div>
            <div className="divide-y">
              {SOURCES.map(s => (
                <div key={s.source} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  <span className="flex-1 text-sm">{s.source}</span>
                  <span className="text-sm font-medium tabular-nums">{s.visitors}</span>
                  <span className="text-xs text-muted-foreground w-9 text-right">
                    {Math.round((s.visitors / totalSources) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Device types */}
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm font-semibold mb-3">Devices</p>
            <div className="space-y-2.5">
              {[
                { icon: Smartphone, label: 'Mobile', pct: 68, color: 'bg-blue-500' },
                { icon: Monitor, label: 'Desktop', pct: 24, color: 'bg-purple-500' },
                { icon: Tablet, label: 'Tablet', pct: 8, color: 'bg-orange-400' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <d.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm w-16">{d.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-8 text-right">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3.5">
          <span className="font-semibold text-sm">Live Locations</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
          {LOCATIONS.map(l => (
            <div key={l.city} className="px-5 py-3 flex items-center gap-3">
              <span className="text-xl">{l.flag}</span>
              <div>
                <p className="text-sm font-medium">{l.city}</p>
                <p className="text-xs text-muted-foreground">{l.visitors} visitors</p>
              </div>
              <div className="ml-auto">
                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${(l.visitors / totalLocations) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
