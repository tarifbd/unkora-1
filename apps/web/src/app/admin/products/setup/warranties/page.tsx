'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { warrantiesApi, type Warranty } from '@/lib/api/products-setup';

const WARRANTY_TYPES = ['seller', 'brand', 'local', 'international', 'no-warranty'];

function WarrantyModal({ warranty, onClose, onSave }: {
  warranty?: Warranty | null;
  onClose: () => void;
  onSave: (data: Partial<Warranty>) => void;
}) {
  const [form, setForm] = useState({
    title: warranty?.title ?? '',
    description: warranty?.description ?? '',
    duration: warranty?.duration ?? '1 Year',
    type: warranty?.type ?? 'seller',
    isActive: warranty?.isActive ?? true,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{warranty ? 'Edit Warranty' : 'Add Warranty'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. 1 Year Brand Warranty"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration *</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="e.g. 1 Year, 6 Months"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.type}
                onChange={e => set('type', e.target.value)}>
                {WARRANTY_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Warranty terms and conditions..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {warranty ? 'Save Changes' : 'Add Warranty'}
          </button>
        </div>
      </div>
    </div>
  );
}

const typeColors: Record<string, string> = {
  seller: 'bg-blue-100 text-blue-700',
  brand: 'bg-purple-100 text-purple-700',
  local: 'bg-green-100 text-green-700',
  international: 'bg-orange-100 text-orange-700',
  'no-warranty': 'bg-gray-100 text-gray-600',
};

export default function WarrantiesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; warranty?: Warranty | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['warranties', true],
    queryFn: () => warrantiesApi.list(true),
  });

  const create = useMutation({
    mutationFn: warrantiesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warranties'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warranty> }) => warrantiesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warranties'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => warrantiesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warranties'] }); setDeleteId(null); },
  });

  const handleSave = (data: Partial<Warranty>) => {
    if (modal.warranty) update.mutate({ id: modal.warranty.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warranties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{warranties.length} warranty policies</p>
        </div>
        <button
          onClick={() => setModal({ open: true, warranty: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Warranty
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warranties.map(w => (
            <div key={w.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{w.title}</p>
                    <p className="text-xs text-muted-foreground">{w.duration}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ open: true, warranty: w })}
                    className="rounded p-1.5 hover:bg-accent text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(w.id)}
                    className="rounded p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {w.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{w.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${typeColors[w.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {w.type}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {w.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-muted-foreground">{w._count?.products ?? 0} products</span>
                </div>
              </div>
            </div>
          ))}
          {warranties.length === 0 && (
            <div className="col-span-3 py-12 text-center text-muted-foreground">No warranties yet.</div>
          )}
        </div>
      )}

      {modal.open && (
        <WarrantyModal warranty={modal.warranty} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Warranty?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => remove.mutate(deleteId)} disabled={remove.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {remove.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
