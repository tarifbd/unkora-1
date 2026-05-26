'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, Tag } from 'lucide-react';
import { attributesApi, type Attribute } from '@/lib/api/products-setup';

function AttributeModal({ attribute, onClose, onSave }: {
  attribute?: Attribute | null;
  onClose: () => void;
  onSave: (data: { name: string; isActive: boolean; values: string[] }) => void;
}) {
  const [name, setName] = useState(attribute?.name ?? '');
  const [isActive, setIsActive] = useState(attribute?.isActive ?? true);
  const [values, setValues] = useState<string[]>(attribute?.values.map(v => v.value) ?? []);
  const [newVal, setNewVal] = useState('');

  const addValue = () => {
    const v = newVal.trim();
    if (v && !values.includes(v)) { setValues(prev => [...prev, v]); setNewVal(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{attribute ? 'Edit Attribute' : 'Add Attribute'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Attribute Name *</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Size, Material, Color"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Values</label>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())}
                placeholder="Add value and press Enter"
              />
              <button onClick={addValue} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {values.map(v => (
                <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {v}
                  <button onClick={() => setValues(prev => prev.filter(x => x !== v))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {values.length === 0 && (
                <p className="text-xs text-muted-foreground">No values added yet</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave({ name, isActive, values })} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {attribute ? 'Save Changes' : 'Add Attribute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttributesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; attr?: Attribute | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ['attributes', true],
    queryFn: () => attributesApi.list(true),
  });

  const create = useMutation({
    mutationFn: attributesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attributes'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof attributesApi.update>[1] }) =>
      attributesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attributes'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => attributesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attributes'] }); setDeleteId(null); },
  });

  const handleSave = (data: { name: string; isActive: boolean; values: string[] }) => {
    if (modal.attr) update.mutate({ id: modal.attr.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attributes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{attributes.length} attributes</p>
        </div>
        <button
          onClick={() => setModal({ open: true, attr: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Attribute
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attributes.map(attr => (
            <div key={attr.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                    <Tag className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{attr.name}</p>
                    <p className="text-xs text-muted-foreground">{attr.values.length} values</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ open: true, attr })}
                    className="rounded p-1.5 hover:bg-accent text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(attr.id)}
                    className="rounded p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attr.values.slice(0, 8).map(v => (
                  <span key={v.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {v.value}
                  </span>
                ))}
                {attr.values.length > 8 && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    +{attr.values.length - 8} more
                  </span>
                )}
                {attr.values.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No values</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end">
                <span className={`text-xs px-2 py-0.5 rounded-full ${attr.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {attr.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
          {attributes.length === 0 && (
            <div className="col-span-3 py-12 text-center text-muted-foreground">
              No attributes yet. Click "Add Attribute" to get started.
            </div>
          )}
        </div>
      )}

      {modal.open && (
        <AttributeModal attribute={modal.attr} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Attribute?</h3>
            <p className="text-sm text-muted-foreground mb-4">All values will also be deleted.</p>
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
