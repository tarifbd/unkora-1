'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus, X, Loader2, Search } from 'lucide-react';
import { inventoryApi, type Warehouse } from '@/lib/api/inventory';

const REASONS = [
  'RECEIVED_GOODS', 'DAMAGED', 'EXPIRED', 'THEFT',
  'CORRECTION', 'RETURN_TO_SUPPLIER', 'WRITE_OFF', 'OTHER',
];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  APPROVED: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700' },
  PENDING:  { label: 'Pending',  bg: 'bg-yellow-50', text: 'text-yellow-700' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50',    text: 'text-red-700' },
};

export default function AdjustmentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: 0, reason: 'CORRECTION', note: '' });
  const [productSearch, setProductSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-adjustments', page],
    queryFn: () => inventoryApi.getAdjustments(page, 30),
  });

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: inventoryApi.getWarehouses });
  const { data: inventory } = useQuery({
    queryKey: ['inventory-overview-adj'],
    queryFn: () => inventoryApi.getOverview(1, 500),
  });

  const createMutation = useMutation({
    mutationFn: () => inventoryApi.createAdjustment(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      setShowForm(false);
      setForm({ productId: '', warehouseId: '', quantity: 0, reason: 'CORRECTION', note: '' });
    },
  });

  const products = (inventory?.data ?? []).filter(p => {
    const q = productSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Stock Adjustments</h1>
          <p className="text-sm text-gray-500">Manual corrections with audit trail</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Adjustment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !data?.data?.length ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold">No adjustments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs">Product</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Warehouse</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Qty</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Reason</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Note</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.data ?? []).map(adj => {
                  const cfg = STATUS_CFG[adj.status] ?? STATUS_CFG.PENDING;
                  return (
                    <tr key={adj.id} className="hover:bg-gray-50/40">
                      <td className="px-5 py-3 font-bold text-gray-800 max-w-[160px] truncate">{adj.productId}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{adj.warehouse?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black text-sm ${adj.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{adj.reason.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.text ?? 'text-gray-600'}`}>{cfg?.label ?? adj.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate">{adj.note ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(adj.createdAt).toLocaleString('en-BD')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data?.meta && data.meta.total > 30 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{data.meta.total} total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * 30 >= data.meta.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">New Stock Adjustment</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Search Product</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Filter products..." className="bg-transparent text-sm flex-1 outline-none" />
                </div>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select product</option>
                  {products.slice(0, 50).map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku ?? '—'})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Warehouse</label>
                <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select warehouse</option>
                  {(warehouses ?? []).map((w: Warehouse) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Quantity (positive = add, negative = remove)</label>
                <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Reason</label>
                <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Note</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {createMutation.error && <p className="text-xs text-red-500">{String((createMutation.error as any)?.response?.data?.message ?? 'Error')}</p>}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.productId || !form.warehouseId || form.quantity === 0 || createMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
