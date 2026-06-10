'use client';

import { useState } from 'react';
import { FlaskConical, Play, Pause, Plus, TrendingUp, Users, CheckCircle, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type TestStatus = 'running' | 'paused' | 'completed' | 'draft';

interface Variant {
  name: string;
  visitors: number;
  conversions: number;
  revenue: number;
  isControl: boolean;
}

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: TestStatus;
  startDate: string;
  endDate?: string;
  type: string;
  variants: Variant[];
  winner?: string;
}

const TESTS: ABTest[] = [
  {
    id: '1',
    name: 'Hero CTA Button Color',
    hypothesis: 'Green CTA button will have higher click rate than orange',
    status: 'running',
    startDate: 'Jun 1, 2026',
    type: 'UI Element',
    variants: [
      { name: 'Control (Orange)', visitors: 2841, conversions: 198, revenue: 138600, isControl: true },
      { name: 'Variant (Green)', visitors: 2793, conversions: 241, revenue: 168700, isControl: false },
    ],
  },
  {
    id: '2',
    name: 'Product Page Layout',
    hypothesis: '"Add to Cart" above the fold will reduce scroll abandonment',
    status: 'running',
    startDate: 'Jun 3, 2026',
    type: 'Page Layout',
    variants: [
      { name: 'Control (Below fold)', visitors: 1934, conversions: 142, revenue: 99400, isControl: true },
      { name: 'Variant (Above fold)', visitors: 1912, conversions: 178, revenue: 124600, isControl: false },
    ],
  },
  {
    id: '3',
    name: 'Checkout Free Shipping Threshold',
    hypothesis: 'Lowering free shipping from ৳1000 to ৳700 increases avg order value',
    status: 'completed',
    startDate: 'May 15, 2026',
    endDate: 'May 31, 2026',
    type: 'Pricing',
    winner: 'Variant (৳700)',
    variants: [
      { name: 'Control (৳1000 threshold)', visitors: 4821, conversions: 342, revenue: 410400, isControl: true },
      { name: 'Variant (৳700 threshold)', visitors: 4734, conversions: 423, revenue: 549900, isControl: false },
    ],
  },
  {
    id: '4',
    name: 'Email Subject Line — Personalized',
    hypothesis: 'Personalized subject lines increase open rates by 20%',
    status: 'paused',
    startDate: 'Jun 5, 2026',
    type: 'Email',
    variants: [
      { name: 'Control (Generic)', visitors: 1200, conversions: 89, revenue: 0, isControl: true },
      { name: 'Variant (Personalized)', visitors: 1185, conversions: 124, revenue: 0, isControl: false },
    ],
  },
];

const STATUS_CONFIG: Record<TestStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  running: { label: 'Running', color: 'text-green-600', bg: 'bg-green-50', icon: Play },
  paused: { label: 'Paused', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Pause },
  completed: { label: 'Completed', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock },
};

function confidence(control: Variant, variant: Variant): number {
  if (control.visitors === 0) return 0;
  const cr1 = control.conversions / control.visitors;
  const cr2 = variant.conversions / variant.visitors;
  const diff = Math.abs(cr2 - cr1) / cr1;
  return Math.min(99, Math.round(50 + diff * 400));
}

export default function ABTestingPage() {
  const [filter, setFilter] = useState<TestStatus | 'all'>('all');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(TESTS[0]);

  const filtered = filter === 'all' ? TESTS : TESTS.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">A/B Testing</h2>
            <p className="text-xs text-muted-foreground">Run experiments to optimize conversions and revenue</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Running Tests', value: TESTS.filter(t => t.status === 'running').length, color: 'text-green-600', bg: 'bg-green-50', icon: Play },
          { label: 'Total Tests', value: TESTS.length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FlaskConical },
          { label: 'Tests Won', value: TESTS.filter(t => t.winner).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
          { label: 'Avg Lift', value: '+18%', color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${s.bg} rounded-lg p-2 w-fit mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test list */}
        <div className="space-y-3">
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {(['all', 'running', 'paused', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 px-2 py-1.5 font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          {filtered.map(test => {
            const sc = STATUS_CONFIG[test.status];
            const Icon = sc.icon;
            return (
              <button
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${selectedTest?.id === test.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${sc.bg} rounded-lg p-1.5 flex-shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${sc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{test.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{test.type}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold ${sc.color}`}>{sc.label}</span>
                      {test.winner && <span className="text-[10px] text-green-600 font-bold">Winner found!</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Test detail */}
        {selectedTest && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-black text-base">{selectedTest.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTest.hypothesis}</p>
                </div>
                {selectedTest.winner && (
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" /> Winner Declared
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Started {selectedTest.startDate}</span>
                {selectedTest.endDate && <span>Ended {selectedTest.endDate}</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selectedTest.variants.reduce((s, v) => s + v.visitors, 0).toLocaleString()} total visitors</span>
              </div>
            </div>

            {/* Variants comparison */}
            {selectedTest.variants.map((variant, i) => {
              const control = selectedTest.variants.find(v => v.isControl)!;
              const cr = (variant.conversions / variant.visitors * 100).toFixed(1);
              const lift = variant.isControl ? null : ((variant.conversions / variant.visitors - control.conversions / control.visitors) / (control.conversions / control.visitors) * 100).toFixed(1);
              const conf = variant.isControl ? null : confidence(control, variant);
              const isWinner = selectedTest.winner === variant.name;

              return (
                <div key={i} className={`bg-white rounded-xl border p-5 shadow-sm ${isWinner ? 'border-green-400 ring-1 ring-green-200' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${variant.isControl ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {variant.isControl ? 'Control' : 'Variant'}
                      </span>
                      <span className="font-bold text-sm">{variant.name}</span>
                      {isWinner && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    {lift && <span className={`text-sm font-black ${parseFloat(lift) > 0 ? 'text-green-600' : 'text-red-500'}`}>{parseFloat(lift) > 0 ? '+' : ''}{lift}% lift</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-black">{variant.visitors.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Visitors</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-indigo-600">{cr}%</p>
                      <p className="text-xs text-muted-foreground">Conv. Rate</p>
                    </div>
                    {variant.revenue > 0 ? (
                      <div>
                        <p className="text-xl font-black text-green-600">৳{(variant.revenue / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xl font-black">{conf ?? '—'}%</p>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                      </div>
                    )}
                  </div>
                  {conf && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${conf >= 95 ? 'bg-green-500' : conf >= 80 ? 'bg-yellow-400' : 'bg-gray-400'}`}
                          style={{ width: `${conf}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 text-right">{conf}% statistical confidence {conf >= 95 ? '✓ Significant' : '— Need more data'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
