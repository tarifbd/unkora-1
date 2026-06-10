'use client';

import { useState } from 'react';
import { MousePointer2, Eye, Clock, LayoutGrid, Monitor, Smartphone } from 'lucide-react';

const pages = ['Home', 'Books', 'Book Detail', 'Cart', 'Checkout'];
const deviceTypes = ['Desktop', 'Mobile'] as const;

// Generate a mock heatmap grid: rows × cols with intensity 0-100
function generateGrid(rows: number, cols: number, seed = 1) {
  const hotspots = [
    { r: 1, c: Math.floor(cols * 0.5), intensity: 90 },
    { r: 2, c: Math.floor(cols * 0.3), intensity: 75 },
    { r: 3, c: Math.floor(cols * 0.7), intensity: 60 },
  ];
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      let v = Math.random() * 15;
      for (const h of hotspots) {
        const dist = Math.sqrt((r - h.r) ** 2 + (c - h.c) ** 2);
        v += h.intensity * Math.exp(-dist * 0.8);
      }
      return Math.min(100, v * seed);
    })
  );
}

function heatColor(v: number): string {
  if (v < 15) return 'rgba(59,130,246,0.08)';
  if (v < 30) return 'rgba(59,130,246,0.25)';
  if (v < 45) return 'rgba(34,197,94,0.4)';
  if (v < 60) return 'rgba(234,179,8,0.55)';
  if (v < 75) return 'rgba(249,115,22,0.7)';
  return 'rgba(239,68,68,0.85)';
}

const scrollDepth = [
  { label: '0–25%', pct: 100 },
  { label: '25–50%', pct: 73 },
  { label: '50–75%', pct: 48 },
  { label: '75–100%', pct: 31 },
];

const clickZones = [
  { name: 'Hero CTA Button', clicks: 2841, pct: 38 },
  { name: 'Category Strip — Academic', clicks: 1923, pct: 26 },
  { name: 'Offer Banner', clicks: 1204, pct: 16 },
  { name: 'Flash Deal Cards', clicks: 987, pct: 13 },
  { name: 'Search Bar', clicks: 512, pct: 7 },
];

export default function HeatmapPage() {
  const [selectedPage, setSelectedPage] = useState('Home');
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');
  const [view, setView] = useState<'click' | 'scroll' | 'move'>('click');

  const rows = 8;
  const cols = device === 'Desktop' ? 14 : 7;
  const grid = generateGrid(rows, cols, view === 'move' ? 0.9 : view === 'scroll' ? 0.7 : 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {pages.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPage(p)}
              className={`px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${selectedPage === p ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {deviceTypes.map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-3 py-1.5 font-medium flex items-center gap-1.5 transition-colors ${device === d ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}
            >
              {d === 'Desktop' ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
              {d}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {(['click', 'scroll', 'move'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 font-medium capitalize transition-colors ${view === v ? 'bg-indigo-500 text-white' : 'hover:bg-gray-50'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clicks', value: '7,467', icon: MousePointer2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Sessions Recorded', value: '3,201', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Avg Time on Page', value: '2m 14s', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Elements Tracked', value: '48', icon: LayoutGrid, color: 'text-green-500', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${s.bg} rounded-lg p-2 w-fit mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">{selectedPage} — {view} heatmap ({device})</h3>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.25)' }} /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(234,179,8,0.55)' }} /> Med
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.85)' }} /> High
              </span>
            </div>
          </div>
          {/* Simulated page wireframe with heatmap overlay */}
          <div className="rounded-lg overflow-hidden border bg-gray-50" style={{ aspectRatio: device === 'Desktop' ? '16/9' : '9/16', position: 'relative' }}>
            <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {grid.map((row, ri) =>
                row.map((val, ci) => (
                  <div
                    key={`${ri}-${ci}`}
                    style={{ background: heatColor(val), transition: 'background 0.5s' }}
                    title={`Intensity: ${val.toFixed(0)}`}
                  />
                ))
              )}
            </div>
            {/* Wireframe overlay elements */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="mx-4 mt-3 h-6 bg-gray-700 rounded" />
              <div className="mx-4 mt-3 h-24 bg-gray-600 rounded" />
              <div className="grid grid-cols-5 gap-2 mx-4 mt-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-500 rounded" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Scroll depth */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">Scroll Depth</h3>
            <div className="space-y-3">
              {scrollDepth.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-bold">{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top click zones */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">Top Click Zones</h3>
            <div className="space-y-2.5">
              {clickZones.map((z, i) => (
                <div key={z.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{z.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${z.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-right w-12">{z.clicks.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
