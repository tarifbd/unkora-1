'use client';

import { useState } from 'react';
import { LayoutGrid, Plus, Settings, GripVertical, X, Eye, BarChart3, TrendingUp, Users, DollarSign, Package, ShoppingBag, Star } from 'lucide-react';

type WidgetType = 'revenue' | 'orders' | 'customers' | 'products' | 'reviews' | 'traffic' | 'conversion' | 'ltv';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'sm' | 'md' | 'lg';
  enabled: boolean;
}

const WIDGET_CATALOG: { type: WidgetType; title: string; icon: React.ElementType; color: string; desc: string }[] = [
  { type: 'revenue', title: 'Revenue Overview', icon: DollarSign, color: 'text-green-500', desc: 'Daily/weekly/monthly revenue trends' },
  { type: 'orders', title: 'Orders Summary', icon: ShoppingBag, color: 'text-blue-500', desc: 'New, processing, completed orders' },
  { type: 'customers', title: 'Customer Growth', icon: Users, color: 'text-purple-500', desc: 'New vs returning customer breakdown' },
  { type: 'products', title: 'Top Products', icon: Package, color: 'text-orange-500', desc: 'Best selling products today' },
  { type: 'reviews', title: 'Recent Reviews', icon: Star, color: 'text-yellow-500', desc: 'Latest customer ratings and feedback' },
  { type: 'traffic', title: 'Live Traffic', icon: TrendingUp, color: 'text-indigo-500', desc: 'Real-time visitor count by page' },
  { type: 'conversion', title: 'Conversion Rate', icon: BarChart3, color: 'text-pink-500', desc: 'Funnel metrics and conversion trends' },
  { type: 'ltv', title: 'Customer LTV', icon: DollarSign, color: 'text-cyan-500', desc: 'Average lifetime value by segment' },
];

const DEFAULT_WIDGETS: Widget[] = [
  { id: '1', type: 'revenue', title: 'Revenue Overview', size: 'md', enabled: true },
  { id: '2', type: 'orders', title: 'Orders Summary', size: 'sm', enabled: true },
  { id: '3', type: 'customers', title: 'Customer Growth', size: 'sm', enabled: true },
  { id: '4', type: 'traffic', title: 'Live Traffic', size: 'lg', enabled: true },
  { id: '5', type: 'conversion', title: 'Conversion Rate', size: 'md', enabled: false },
  { id: '6', type: 'reviews', title: 'Recent Reviews', size: 'sm', enabled: false },
];

const SIZE_LABELS = { sm: 'Small (1×1)', md: 'Medium (2×1)', lg: 'Large (3×1)' } as const;

function WidgetPreview({ type }: { type: WidgetType }) {
  const bg: Record<WidgetType, string> = {
    revenue: 'from-green-50 to-emerald-50 border-green-200',
    orders: 'from-blue-50 to-sky-50 border-blue-200',
    customers: 'from-purple-50 to-violet-50 border-purple-200',
    products: 'from-orange-50 to-amber-50 border-orange-200',
    reviews: 'from-yellow-50 to-amber-50 border-yellow-200',
    traffic: 'from-indigo-50 to-blue-50 border-indigo-200',
    conversion: 'from-pink-50 to-rose-50 border-pink-200',
    ltv: 'from-cyan-50 to-sky-50 border-cyan-200',
  };
  const meta = WIDGET_CATALOG.find(w => w.type === type);
  const Icon = meta?.icon ?? BarChart3;
  return (
    <div className={`h-24 rounded-lg border bg-gradient-to-br ${bg[type]} flex flex-col items-center justify-center gap-2`}>
      <Icon className={`h-6 w-6 ${meta?.color}`} />
      <div className="space-y-1 w-3/4">
        <div className="h-1.5 bg-white/70 rounded-full" />
        <div className="h-1.5 bg-white/50 rounded-full w-3/4 mx-auto" />
      </div>
    </div>
  );
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [showCatalog, setShowCatalog] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleWidget = (id: string) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const removeWidget = (id: string) => setWidgets(ws => ws.filter(w => w.id !== id));
  const changeSize = (id: string, size: Widget['size']) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, size } : w));

  const addWidget = (type: WidgetType) => {
    const meta = WIDGET_CATALOG.find(m => m.type === type);
    if (!meta) return;
    const newWidget: Widget = { id: Date.now().toString(), type, title: meta.title, size: 'md', enabled: true };
    setWidgets(ws => [...ws, newWidget]);
    setShowCatalog(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Dashboard Widgets</h2>
            <p className="text-xs text-muted-foreground">Customize your analytics dashboard layout</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatalog(true)}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Widget
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {saved ? '✓ Saved!' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Widget list */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-bold text-sm">Active Widgets ({widgets.filter(w => w.enabled).length} enabled)</h3>
          <p className="text-xs text-muted-foreground mt-1">Drag to reorder, toggle to show/hide on dashboard</p>
        </div>
        <div className="divide-y">
          {widgets.map(w => {
            const meta = WIDGET_CATALOG.find(m => m.type === w.type);
            const Icon = meta?.icon ?? BarChart3;
            return (
              <div key={w.id} className={`flex items-center gap-4 p-4 transition-colors ${w.enabled ? '' : 'opacity-50'}`}>
                <GripVertical className="h-5 w-5 text-gray-300 cursor-grab flex-shrink-0" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${w.enabled ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                  <Icon className={`h-4 w-4 ${w.enabled ? meta?.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{meta?.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Size selector */}
                  <select
                    value={w.size}
                    onChange={e => changeSize(w.id, e.target.value as Widget['size'])}
                    className="text-xs border rounded-lg px-2 py-1.5 bg-transparent"
                  >
                    {Object.entries(SIZE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {/* Toggle */}
                  <button onClick={() => toggleWidget(w.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${w.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${w.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button onClick={() => removeWidget(w.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog modal */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-black">Add Widget</h3>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {WIDGET_CATALOG.map(meta => {
                const alreadyAdded = widgets.some(w => w.type === meta.type && w.enabled);
                return (
                  <button
                    key={meta.type}
                    onClick={() => !alreadyAdded && addWidget(meta.type)}
                    disabled={alreadyAdded}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${alreadyAdded ? 'opacity-40 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                  >
                    <WidgetPreview type={meta.type} />
                    <p className="font-semibold text-sm mt-3">{meta.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                    {alreadyAdded && <span className="text-xs text-green-600 font-medium">Already added</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
