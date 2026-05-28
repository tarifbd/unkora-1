'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, Loader2, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { inventoryApi } from '@/lib/api/inventory';
import type { Supplier } from '@/lib/api/inventory';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:      { label: 'Active',      bg: 'bg-green-50',  text: 'text-green-700' },
  INACTIVE:    { label: 'Inactive',    bg: 'bg-gray-100',  text: 'text-gray-600' },
  BLACKLISTED: { label: 'Blacklisted', bg: 'bg-red-50',    text: 'text-red-700' },
};

const BLANK_FORM = { name: '', code: '', contactPerson: '', email: '', phone: '', address: '', city: '', notes: '' };

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<Supplier | 'new' | null>(null);
  const [form, setForm] = useState(BLANK_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, status],
    queryFn: () => inventoryApi.getSuppliers(page, 20, status || undefined),
  });

  const openEdit = (s: Supplier) => { setForm({ name: s.name, code: s.code, contactPerson: s.contactPerson ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '', city: s.city ?? '', notes: s.notes ?? '' }); setModal(s); };
  const openNew = () => { setForm(BLANK_FORM); setModal('new'); };

  const saveMutation = useMutation({
    mutationFn: () => modal === 'new' ? inventoryApi.createSupplier(form) : inventoryApi.updateSupplier((modal as Supplier).id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">Vendor management</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="flex gap-2">
        {[['', 'All'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive'], ['BLACKLISTED', 'Blacklisted']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v ?? '')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${status === v ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !data?.data?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-bold">No suppliers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs">Supplier</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Contact</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs">Location</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">POs</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map(s => {
                const cfg = STATUS_CFG[s.status];
                return (
                  <tr key={s.id} className="hover:bg-gray-50/40">
                    <td className="px-5 py-3">
                      <p className="font-bold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {s.contactPerson && <p className="text-xs text-gray-700 font-medium">{s.contactPerson}</p>}
                        {s.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>}
                        {s.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.city || s.address
                        ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[s.city, s.address].filter(Boolean).join(', ')}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{s._count?.purchaseOrders ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.text ?? 'text-gray-600'}`}>{cfg?.label ?? s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                        <button onClick={() => { if (confirm('Delete this supplier?')) deleteMutation.mutate(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.meta.total > 20 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">{data.meta.total} total</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <button disabled={page * 20 >= data.meta.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">{modal === 'new' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {([
                ['name', 'Name *', 'ABC Distributors'],
                ['code', 'Code *', 'ABC'],
                ['contactPerson', 'Contact Person', 'John Doe'],
                ['phone', 'Phone', '01XXXXXXXXX'],
                ['email', 'Email', 'supplier@example.com'],
                ['city', 'City', 'Dhaka'],
                ['address', 'Address', 'Full address'],
                ['notes', 'Notes', 'Optional notes'],
              ] as [string, string, string][]).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 block mb-1">{label}</label>
                  <input value={(form as any)[key]} onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
                    placeholder={placeholder} disabled={key === 'code' && modal !== 'new'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50" />
                </div>
              ))}
              {saveMutation.error && <p className="text-xs text-red-500">{String((saveMutation.error as any)?.response?.data?.message ?? 'Error')}</p>}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.code || saveMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
