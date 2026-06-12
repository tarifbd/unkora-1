'use client';

import { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Edit2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type StockStatus = 'in_stock' | 'low' | 'out';

const INVENTORY: { id: string; title: string; sku: string; stock: number; threshold: number; price: number; sold: number }[] = [
  { id: '1', title: 'Python Programming — 2nd Edition',     sku: 'BK-PY-001', stock: 45, threshold: 10, price: 1250, sold: 234 },
  { id: '2', title: 'বাংলাদেশের ইতিহাস (হার্ডকভার)',        sku: 'BK-HI-012', stock: 8,  threshold: 10, price: 890,  sold: 142 },
  { id: '3', title: 'English Grammar in Use — 5th Ed.',     sku: 'BK-EG-008', stock: 0,  threshold: 5,  price: 650,  sold: 98  },
  { id: '4', title: 'Data Structures & Algorithms',         sku: 'BK-DS-003', stock: 22, threshold: 10, price: 2100, sold: 67  },
  { id: '5', title: 'রবীন্দ্র রচনাবলী (সংকলন)',            sku: 'BK-LI-021', stock: 3,  threshold: 5,  price: 1800, sold: 89  },
  { id: '6', title: 'আমার ছেলেবেলা — মুহম্মদ জাফর ইকবাল', sku: 'BK-LI-034', stock: 31, threshold: 10, price: 350,  sold: 312 },
];

const STATUS: Record<StockStatus, { label: string; color: string; icon: React.ElementType }> = {
  in_stock: { label: 'স্টকে আছে',  color: 'text-green-600 bg-green-50 border-green-200', icon: Package },
  low:      { label: 'কম স্টক',    color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  out:      { label: 'স্টক শেষ',   color: 'text-red-500 bg-red-50 border-red-200',       icon: TrendingDown },
};

function getStatus(stock: number, threshold: number): StockStatus {
  if (stock === 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'in_stock';
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockStatus | 'all'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(INVENTORY.map(p => [p.id, p.stock]))
  );

  const filtered = INVENTORY
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .filter(p => filter === 'all' || getStatus(stocks[p.id] ?? p.stock, p.threshold) === filter);

  const counts = {
    all:      INVENTORY.length,
    in_stock: INVENTORY.filter(p => getStatus(stocks[p.id] ?? p.stock, p.threshold) === 'in_stock').length,
    low:      INVENTORY.filter(p => getStatus(stocks[p.id] ?? p.stock, p.threshold) === 'low').length,
    out:      INVENTORY.filter(p => getStatus(stocks[p.id] ?? p.stock, p.threshold) === 'out').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">ইনভেন্টরি</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার পণ্যের স্টক ম্যানেজ করুন</p>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> স্টক আপডেট
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'all',      label: 'মোট পণ্য',   color: 'text-gray-900 bg-gray-50' },
          { key: 'in_stock', label: 'স্টকে আছে',  color: 'text-green-600 bg-green-50' },
          { key: 'low',      label: 'কম স্টক',    color: 'text-amber-600 bg-amber-50' },
          { key: 'out',      label: 'স্টক শেষ',   color: 'text-red-500 bg-red-50' },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={cn('rounded-2xl border p-4 text-center transition-all hover:shadow-sm',
              filter === s.key ? 'border-primary/30 ring-2 ring-primary/10' : 'border-gray-100 bg-white')}>
            <p className={`text-2xl font-black ${s.color.split(' ')[0]}`}>{counts[s.key]}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="পণ্যের নাম বা SKU দিয়ে খুঁজুন..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">পণ্য</th>
                <th className="text-left px-3 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">স্টক</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">বিক্রয়</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">স্ট্যাটাস</th>
                <th className="text-center px-3 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const currentStock = stocks[p.id] ?? p.stock;
                const status = getStatus(currentStock, p.threshold);
                const meta = STATUS[status];
                const StatusIcon = meta.icon;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">৳{p.price.toLocaleString()}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{p.sku}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {editing === p.id ? (
                        <input type="number" min="0" defaultValue={currentStock}
                          onBlur={e => { setStocks(s => ({ ...s, [p.id]: Number(e.target.value) })); setEditing(null); }}
                          className="w-16 text-center rounded-lg border border-primary/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus />
                      ) : (
                        <span className={cn('text-sm font-black', status === 'out' ? 'text-red-500' : status === 'low' ? 'text-amber-600' : 'text-gray-900')}>
                          {currentStock}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="text-sm text-gray-600">{p.sold}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.color)}>
                        <StatusIcon className="w-2.5 h-2.5" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <button onClick={() => setEditing(p.id)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
