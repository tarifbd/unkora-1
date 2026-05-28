'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { inventoryApi, type Warehouse } from '@/lib/api/inventory';

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: 'bg-green-50 text-green-700', SALE: 'bg-red-50 text-red-700',
  RETURN: 'bg-blue-50 text-blue-700', ADJUSTMENT_IN: 'bg-teal-50 text-teal-700',
  ADJUSTMENT_OUT: 'bg-orange-50 text-orange-700', DAMAGE: 'bg-red-100 text-red-800',
  RESERVED: 'bg-yellow-50 text-yellow-700', RESERVATION_RELEASED: 'bg-gray-100 text-gray-600',
  RESERVATION_CONFIRMED: 'bg-purple-50 text-purple-700', CORRECTION: 'bg-indigo-50 text-indigo-700',
  INITIAL_STOCK: 'bg-emerald-50 text-emerald-700', TRANSFER_IN: 'bg-cyan-50 text-cyan-700',
  TRANSFER_OUT: 'bg-pink-50 text-pink-700', EXPIRED: 'bg-gray-50 text-gray-600',
};

const TYPES = [
  'PURCHASE','SALE','RETURN','ADJUSTMENT_IN','ADJUSTMENT_OUT',
  'RESERVED','RESERVATION_RELEASED','CORRECTION','DAMAGE','INITIAL_STOCK',
];

export default function MovementsPage() {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: inventoryApi.getWarehouses });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', page, warehouseId, type],
    queryFn: () => inventoryApi.getMovements(page, 50, undefined, warehouseId || undefined, type || undefined),
  });

  const rows = (data?.data ?? []).filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.product?.name?.toLowerCase().includes(q) || m.product?.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">Movement Ledger</h1>
        <p className="text-sm text-gray-500">Append-only record of all stock changes</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." className="bg-transparent text-sm flex-1 outline-none" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
          <option value="">All Warehouses</option>
          {(warehouses ?? []).map((w: Warehouse) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold">No movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs">Product</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Warehouse</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Type</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Qty</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Reference</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-gray-800 max-w-[200px] truncate">{m.product?.name}</p>
                      <p className="text-xs text-gray-400">{m.product?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.warehouse?.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLORS[m.type] ?? 'bg-gray-50 text-gray-500'}`}>
                        {m.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`flex items-center justify-center gap-0.5 font-black text-sm ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {Math.abs(m.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate">{m.reference ?? m.note ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('en-BD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.meta && data.meta.total > 50 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{data.meta.total} total movements</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * 50 >= data.meta.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
