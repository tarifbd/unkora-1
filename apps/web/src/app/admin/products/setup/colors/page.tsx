'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { colorsApi, type Color } from '@/lib/api/products-setup';

const PRESETS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6',
  '#8b5cf6','#ec4899','#6b7280','#1f2937','#ffffff','#000000',
];

function ColorModal({ color, onClose, onSave }: {
  color?: Color | null;
  onClose: () => void;
  onSave: (data: Partial<Color>) => void;
}) {
  const [form, setForm] = useState({
    name: color?.name ?? '',
    hexCode: color?.hexCode ?? '#3b82f6',
    isActive: color?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{color ? 'Edit Color' : 'Add Color'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Color Name *</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Royal Blue"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Hex Code *</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.hexCode}
                onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))}
                className="h-10 w-16 rounded cursor-pointer border"
              />
              <input
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.hexCode}
                onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))}
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(hex => (
                <button
                  key={hex}
                  onClick={() => setForm(f => ({ ...f, hexCode: hex }))}
                  style={{ backgroundColor: hex }}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${form.hexCode === hex ? 'border-foreground scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {color ? 'Save Changes' : 'Add Color'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ColorsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; color?: Color | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: colors = [], isLoading } = useQuery({
    queryKey: ['colors', true],
    queryFn: () => colorsApi.list(true),
  });

  const create = useMutation({
    mutationFn: colorsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['colors'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Color> }) => colorsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['colors'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => colorsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['colors'] }); setDeleteId(null); },
  });

  const handleSave = (data: Partial<Color>) => {
    if (modal.color) update.mutate({ id: modal.color.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{colors.length} colors defined</p>
        </div>
        <button
          onClick={() => setModal({ open: true, color: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Color
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {colors.map(color => (
            <div key={color.id} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all">
              <div
                className="mx-auto mb-3 h-14 w-14 rounded-full shadow-md border-4 border-white"
                style={{ backgroundColor: color.hexCode }}
              />
              <p className="text-center text-sm font-semibold truncate">{color.name}</p>
              <p className="text-center text-xs font-mono text-muted-foreground mt-0.5">{color.hexCode}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${color.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {color.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ open: true, color })}
                  className="rounded p-1 hover:bg-accent text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(color.id)}
                  className="rounded p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setModal({ open: true, color: null })}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Color</span>
          </button>
        </div>
      )}

      {modal.open && (
        <ColorModal color={modal.color} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Color?</h3>
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
