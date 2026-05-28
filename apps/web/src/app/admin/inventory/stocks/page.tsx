'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Search, X, Loader2, RefreshCw, Pencil } from 'lucide-react';
import Image from 'next/image';
import { inventoryApi, type InventoryStock, type Warehouse } from '@/lib/api/inventory';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  IN_STOCK:     { label: 'In Stock',     bg: 'bg-green-50',  text: 'text-green-700' },
  LOW_STOCK:    { label: 'Low Stock',    bg: 'bg-yellow-50', text: 'text-yellow-700' },
  OUT_OF_STOCK: { label: 'Out of Stock', bg: 'bg-red-50',    text: 'text-red-700' },
  DISCONTINUED: { label: 'Discontinued', bg: 'bg-gray-100',  text: 'text-gray-600' },
};

export default function StocksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [setModal, setSetModal] = useState<InventoryStock | null>(null);
  const [qty, setQty] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [note, setNote] = useState('');

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: inventoryApi.getWarehouses });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-stocks', page, warehouseId, status],
    queryFn: () => inventoryApi.getStocks(page, 30, warehouseId || undefined, status || undefined),
  });

  const setMutation = useMutation({
    mutationFn: (v: { productId: string; warehouseId: string; quantity: number; lowStockThreshold: number; note: string }) =>
      inventoryApi.setStock(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      setSetModal(null);
    },
  });

  const stocks = (data?.data ?? []).filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.product.name.toLowerCase().includes(q) || s.product.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Inventory Stocks</h1>
          <p className="text-sm text-gray-500">Real-time stock levels by warehouse</p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['inventory-stocks'] })} className="p-2 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="bg-transparent text-sm flex-1 outline-none" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none">
          <option value="">All Warehouses</option>
          {(warehouses ?? []).map((w: Warehouse) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none">
          <option value="">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold">No stock records found</p>
            <p className="text-sm mt-1">Receive goods from a Purchase Order to create stock records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs">Product</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Warehouse</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">On Hand</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Reserved</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Available</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stocks.map(s => {
                  const available = s.quantityOnHand - s.quantityReserved - s.quantityDamaged;
                  const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.OUT_OF_STOCK;
                  const img = s.product.images?.[0]?.url;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            {img ? <Image src={img} alt={s.product.name} width={32} height={32} className="w-full h-full object-cover" /> : <Package className="w-3.5 h-3.5 text-gray-300 m-2" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 max-w-[180px] truncate">{s.product.name}</p>
                            <p className="text-xs text-gray-400">{s.product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.warehouse.name}</td>
                      <td className="px-4 py-3 text-center font-black text-gray-900">{s.quantityOnHand}</td>
                      <td className="px-4 py-3 text-center text-yellow-600 font-bold">{s.quantityReserved}</td>
                      <td className="px-4 py-3 text-center font-black text-primary">{available}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg?.bg ?? 'bg-red-50'} ${cfg?.text ?? 'text-red-700'}`}>{cfg?.label ?? s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSetModal(s); setQty(s.quantityOnHand); setThreshold(s.lowStockThreshold); setNote(''); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Set Stock Modal */}
      {setModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Set Stock</h3>
              <button onClick={() => setSetModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm font-bold text-gray-800 mb-4">{setModal.product.name}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Quantity on Hand</label>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Low Stock Threshold</label>
                <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} min={0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional reason"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setSetModal(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => setMutation.mutate({ productId: setModal.productId, warehouseId: setModal.warehouseId, quantity: qty, lowStockThreshold: threshold, note })}
                disabled={setMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {setMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
