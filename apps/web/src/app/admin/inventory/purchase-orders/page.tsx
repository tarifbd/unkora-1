'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, X, Loader2, Eye, ChevronDown, ChevronUp, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { inventoryApi, type Warehouse, type Supplier, type PurchaseOrder } from '@/lib/api/inventory';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:              { label: 'Draft',              bg: 'bg-gray-100',   text: 'text-gray-600' },
  ORDERED:            { label: 'Ordered',            bg: 'bg-blue-50',    text: 'text-blue-700' },
  PARTIALLY_RECEIVED: { label: 'Partial',            bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  RECEIVED:           { label: 'Received',           bg: 'bg-green-50',   text: 'text-green-700' },
  CANCELLED:          { label: 'Cancelled',          bg: 'bg-red-50',     text: 'text-red-700' },
};

export default function PurchaseOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  // Create form state
  const [form, setForm] = useState({ supplierId: '', warehouseId: '', expectedDate: '', notes: '' });
  const [items, setItems] = useState<{ productId: string; productName: string; quantityOrdered: number; unitCost: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, status],
    queryFn: () => inventoryApi.getPurchaseOrders(page, 20, status || undefined),
  });

  const { data: expandedPO } = useQuery({
    queryKey: ['purchase-order', expandedId],
    queryFn: () => inventoryApi.getPurchaseOrder(expandedId!),
    enabled: !!expandedId,
  });

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-list'], queryFn: () => inventoryApi.getSuppliers(1, 100) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: inventoryApi.getWarehouses });
  const { data: inventory } = useQuery({ queryKey: ['inventory-po-products'], queryFn: () => inventoryApi.getOverview(1, 500) });

  const createMutation = useMutation({
    mutationFn: () => inventoryApi.createPurchaseOrder({
      ...form,
      items: items.map(i => ({ productId: i.productId, quantityOrdered: i.quantityOrdered, unitCost: i.unitCost })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setShowCreate(false); setItems([]); setForm({ supplierId: '', warehouseId: '', expectedDate: '', notes: '' }); },
  });

  const orderMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.markOrdered(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.cancelPO(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.receivePO(id, {
      items: Object.entries(receiveQtys).map(([itemId, qty]) => ({ itemId, quantityReceived: qty })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-order', receiving] }); setReceiving(null); setReceiveQtys({}); },
  });

  const filteredProducts = (inventory?.data ?? []).filter(p => {
    const q = productSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
  });

  const addItem = (p: any) => {
    if (items.find(i => i.productId === p.id)) return;
    setItems(prev => [...prev, { productId: p.id, productName: p.name, quantityOrdered: 1, unitCost: Number(p.basePrice) }]);
    setProductSearch('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500">Manage inbound stock from suppliers</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['DRAFT', 'Draft'], ['ORDERED', 'Ordered'], ['PARTIALLY_RECEIVED', 'Partial'], ['RECEIVED', 'Received'], ['CANCELLED', 'Cancelled']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v ?? '')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${status === v ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* PO list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !data?.data?.length ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold">No purchase orders</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(data?.data ?? []).map(po => {
              const cfg = STATUS_CFG[po.status];
              const isExpanded = expandedId === po.id;
              return (
                <div key={po.id}>
                  <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-gray-900 font-mono text-sm">{po.poNumber}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.text ?? 'text-gray-600'}`}>{cfg?.label ?? po.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{po.supplier?.name} · {po.warehouse?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">৳{Number(po.total).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(po.createdAt).toLocaleDateString('en-BD')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {po.status === 'DRAFT' && (
                        <button onClick={() => orderMutation.mutate(po.id)} title="Mark as Ordered"
                          className="p-1.5 rounded-lg hover:bg-blue-50" disabled={orderMutation.isPending}>
                          <Check className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                      {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                        <button onClick={() => { setReceiving(po.id); setReceiveQtys({}); setExpandedId(po.id); }}
                          className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100">
                          Receive
                        </button>
                      )}
                      {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                        <button onClick={() => { if (confirm('Cancel this PO?')) cancelMutation.mutate(po.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                      <button onClick={() => setExpandedId(isExpanded ? null : po.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && expandedPO && (
                    <div className="px-5 pb-4 bg-gray-50/40 border-t border-gray-50">
                      <div className="mt-3 space-y-2">
                        {(expandedPO as any).items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800">{item.productId}</p>
                              <p className="text-xs text-gray-400">Ordered: {item.quantityOrdered} · Received: {item.quantityReceived} · ৳{Number(item.unitCost).toFixed(2)}</p>
                            </div>
                            {receiving === po.id && item.quantityReceived < item.quantityOrdered && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Receive:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={item.quantityOrdered - item.quantityReceived}
                                  value={receiveQtys[item.id] ?? 0}
                                  onChange={e => setReceiveQtys(q => ({ ...q, [item.id]: Number(e.target.value) }))}
                                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {receiving === po.id && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => setReceiving(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button
                              onClick={() => receiveMutation.mutate(po.id)}
                              disabled={receiveMutation.isPending}
                              className="flex-1 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                            >
                              {receiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Confirm Receipt'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {data?.meta && data.meta.total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{data.meta.total} total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * 20 >= data.meta.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Supplier *</label>
                  <select value={form.supplierId} onChange={e => setForm(v => ({ ...v, supplierId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select supplier</option>
                    {(suppliers?.data ?? []).map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Warehouse *</label>
                  <select value={form.warehouseId} onChange={e => setForm(v => ({ ...v, warehouseId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select warehouse</option>
                    {(warehouses ?? []).map((w: Warehouse) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Expected Delivery</label>
                <input type="date" value={form.expectedDate} onChange={e => setForm(v => ({ ...v, expectedDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))} placeholder="Optional"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Items */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Items</label>
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search and add products..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {productSearch && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-2 max-h-32 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map(p => (
                      <button key={p.id} onClick={() => addItem(p)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-gray-400">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                        <span className="text-xs font-bold text-gray-700 flex-1 truncate">{item.productName}</span>
                        <input type="number" min={1} value={item.quantityOrdered}
                          onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantityOrdered: Number(e.target.value) } : it))}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" />
                        <span className="text-xs text-gray-400">×</span>
                        <input type="number" min={0} value={item.unitCost}
                          onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitCost: Number(e.target.value) } : it))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" placeholder="Cost" />
                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-50 rounded">
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                    <div className="text-right text-sm font-black text-gray-800 pr-2">
                      Total: ৳{items.reduce((s, i) => s + i.unitCost * i.quantityOrdered, 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              {createMutation.error && <p className="text-xs text-red-500">{String((createMutation.error as any)?.response?.data?.message ?? 'Error')}</p>}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.supplierId || !form.warehouseId || items.length === 0 || createMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
