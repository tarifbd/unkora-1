'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Warehouse, Plus, X, Loader2, Pencil, Trash2, Star } from 'lucide-react';
import { inventoryApi } from '@/lib/api/inventory';
import type { Warehouse as WarehouseType } from '@/lib/api/inventory';

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<WarehouseType | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', isDefault: false });

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: inventoryApi.getWarehouses,
  });

  const openEdit = (w: WarehouseType) => {
    setForm({ name: w.name, code: w.code, address: w.address ?? '', city: w.city ?? '', isDefault: w.isDefault });
    setModal(w);
  };
  const openNew = () => {
    setForm({ name: '', code: '', address: '', city: '', isDefault: false });
    setModal('new');
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      modal === 'new'
        ? inventoryApi.createWarehouse(form)
        : inventoryApi.updateWarehouse((modal as WarehouseType).id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500">Manage storage locations</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !warehouses?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <Warehouse className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-bold">No warehouses yet</p>
          <p className="text-sm mt-1">Add your first warehouse to start tracking inventory</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(w => (
            <div key={w.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${w.isDefault ? 'border-primary/30' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Warehouse className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{w.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{w.code}</p>
                  </div>
                </div>
                {w.isDefault && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              </div>
              {(w.city || w.address) && (
                <p className="text-xs text-gray-500 mb-3">{[w.city, w.address].filter(Boolean).join(', ')}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span>{w._count?.stocks ?? 0} products</span>
                <span>·</span>
                <span>{w._count?.purchaseOrders ?? 0} POs</span>
                <span>·</span>
                <span className={w.isActive ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{w.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(w)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                {!w.isDefault && (
                  <button
                    onClick={() => { if (confirm('Delete this warehouse?')) deleteMutation.mutate(w.id); }}
                    className="p-1.5 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">{modal === 'new' ? 'Add Warehouse' : 'Edit Warehouse'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name',    label: 'Name',    placeholder: 'Main Warehouse' },
                { key: 'code',    label: 'Code',    placeholder: 'MAIN' },
                { key: 'city',    label: 'City',    placeholder: 'Dhaka' },
                { key: 'address', label: 'Address', placeholder: 'Full address' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-500 block mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} disabled={f.key === 'code' && modal !== 'new'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(v => ({ ...v, isDefault: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm font-bold text-gray-700">Set as default warehouse</span>
              </label>
              {saveMutation.error && <p className="text-xs text-red-500">{String((saveMutation.error as any)?.response?.data?.message ?? 'Error')}</p>}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || !form.code || saveMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
