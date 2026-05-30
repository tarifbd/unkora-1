'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { productLabelsApi, type ProductLabel } from '@/lib/api/products-setup';

const PRESET_COLORS = [
  { name: 'Red', color: '#ef4444', bgColor: '#fef2f2' },
  { name: 'Orange', color: '#f97316', bgColor: '#fff7ed' },
  { name: 'Yellow', color: '#eab308', bgColor: '#fefce8' },
  { name: 'Green', color: '#16a34a', bgColor: '#f0fdf4' },
  { name: 'Blue', color: '#2563eb', bgColor: '#eff6ff' },
  { name: 'Purple', color: '#9333ea', bgColor: '#faf5ff' },
  { name: 'Pink', color: '#ec4899', bgColor: '#fdf2f8' },
  { name: 'Teal', color: '#0d9488', bgColor: '#f0fdfa' },
];

function LabelModal({ label, onClose, onSave }: {
  label?: ProductLabel | null;
  onClose: () => void;
  onSave: (data: Partial<ProductLabel>) => void;
}) {
  const [form, setForm] = useState({
    name: label?.name ?? '',
    color: label?.color ?? '#ef4444',
    bgColor: label?.bgColor ?? '#fef2f2',
    isActive: label?.isActive ?? true,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{label ? 'Edit Label' : 'Add Label'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Label Name *</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. New, Hot, Sale, Featured"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Color Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { set('color', p.color); set('bgColor', p.bgColor); }}
                  className={`rounded-lg border-2 p-2 transition-all ${form.color === p.color ? 'border-foreground' : 'border-transparent hover:border-muted-foreground/30'}`}
                  style={{ backgroundColor: p.bgColor }}>
                  <span style={{ color: p.color }} className="text-xs font-bold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Text Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer" />
                <input className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none"
                  value={form.color} onChange={e => set('color', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Background</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColor} onChange={e => set('bgColor', e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer" />
                <input className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none"
                  value={form.bgColor} onChange={e => set('bgColor', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Preview</label>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border"
                style={{ color: form.color, backgroundColor: form.bgColor, borderColor: form.color + '40' } as React.CSSProperties}>
                {form.name || 'Label Preview'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {label ? 'Save Changes' : 'Add Label'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LabelsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; label?: ProductLabel | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['product-labels', true],
    queryFn: () => productLabelsApi.list(true),
  });

  const create = useMutation({
    mutationFn: productLabelsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-labels'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductLabel> }) => productLabelsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-labels'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => productLabelsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-labels'] }); setDeleteId(null); },
  });

  const handleSave = (data: Partial<ProductLabel>) => {
    if (modal.label) update.mutate({ id: modal.label.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Labels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.length} labels</p>
        </div>
        <button
          onClick={() => setModal({ open: true, label: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Label
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {labels.map(label => (
            <div key={label.id} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all">
              <div className="flex justify-center mb-3">
                <span
                  style={{ color: label.color, backgroundColor: label.bgColor, borderColor: label.color + '40' }}
                  className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold border">
                  {label.name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{label._count?.products ?? 0} products</span>
                <span>•</span>
                <span className={label.isActive ? 'text-green-600' : 'text-gray-400'}>
                  {label.isActive ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ open: true, label })}
                  className="rounded p-1 hover:bg-accent text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(label.id)}
                  className="rounded p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setModal({ open: true, label: null })}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Label</span>
          </button>
        </div>
      )}

      {modal.open && (
        <LabelModal label={modal.label} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Label?</h3>
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
