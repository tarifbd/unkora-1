'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Pencil, X, Check, Megaphone } from 'lucide-react';
import api from '@/lib/api';

interface SmartBar {
  id: string;
  text: string;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  productId?: string;
  product?: { id: string; name: string; slug: string };
  createdAt: string;
}

interface SmartBarForm {
  text: string;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

const EMPTY: SmartBarForm = {
  text: '', linkUrl: '', bgColor: '#f97316', textColor: '#ffffff',
  isActive: true, startsAt: '', endsAt: '',
};

const inputCls = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function SmartBarPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SmartBar | null>(null);
  const [form, setForm] = useState<SmartBarForm>(EMPTY);

  const { data: bars = [], isLoading } = useQuery<SmartBar[]>({
    queryKey: ['smart-bars'],
    queryFn: () => api.get<SmartBar[]>('/smart-bar/active').then(r => r.data),
  });

  const save = useMutation({
    mutationFn: (payload: Partial<SmartBarForm> & { productId?: string }) =>
      editing
        ? api.patch(`/smart-bar/${editing.id}`, payload).then(r => r.data)
        : api.post('/smart-bar/product/global', payload).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['smart-bars'] }); resetForm(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/smart-bar/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['smart-bars'] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/smart-bar/${id}`, { isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['smart-bars'] }),
  });

  function resetForm() { setForm(EMPTY); setEditing(null); setShowForm(false); }

  function startEdit(bar: SmartBar) {
    setEditing(bar);
    setForm({
      text: bar.text,
      linkUrl: bar.linkUrl ?? '',
      bgColor: bar.bgColor ?? '#f97316',
      textColor: bar.textColor ?? '#ffffff',
      isActive: bar.isActive,
      startsAt: bar.startsAt ? bar.startsAt.slice(0, 16) : '',
      endsAt: bar.endsAt ? bar.endsAt.slice(0, 16) : '',
    });
    setShowForm(true);
  }

  const f = (k: keyof SmartBarForm, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Smart Bar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Announcement bars shown at the top of the storefront</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Bar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? 'Edit Smart Bar' : 'New Smart Bar'}</h2>
            <button onClick={resetForm} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Message Text *</label>
              <input value={form.text} onChange={e => f('text', e.target.value)}
                placeholder="🔥 Free shipping on orders over ৳500!" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Link URL (optional)</label>
              <input value={form.linkUrl} onChange={e => f('linkUrl', e.target.value)}
                placeholder="https://..." className={inputCls} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Background</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.bgColor} onChange={e => f('bgColor', e.target.value)}
                    className="h-9 w-12 rounded cursor-pointer border" />
                  <input value={form.bgColor} onChange={e => f('bgColor', e.target.value)}
                    className={`${inputCls} flex-1`} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.textColor} onChange={e => f('textColor', e.target.value)}
                    className="h-9 w-12 rounded cursor-pointer border" />
                  <input value={form.textColor} onChange={e => f('textColor', e.target.value)}
                    className={`${inputCls} flex-1`} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Starts At</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => f('startsAt', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ends At</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => f('endsAt', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Preview */}
          {form.text && (
            <div className="rounded-lg overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
              <div className="py-2 px-4 text-center text-sm font-medium"
                style={{ backgroundColor: form.bgColor, color: form.textColor }}>
                {form.text}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)}
                className="rounded" />
              Active
            </label>
            <div className="flex-1" />
            <button onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
            <button
              onClick={() => save.mutate({ text: form.text, linkUrl: form.linkUrl || undefined, bgColor: form.bgColor, textColor: form.textColor, isActive: form.isActive, startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined })}
              disabled={!form.text || save.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bars.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No smart bars yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create an announcement bar to show at the top of your store</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bars.map(bar => (
            <div key={bar.id} className="rounded-xl border bg-card overflow-hidden">
              {/* Bar preview */}
              <div className="py-2 px-4 text-center text-sm font-medium"
                style={{ backgroundColor: bar.bgColor ?? '#f97316', color: bar.textColor ?? '#fff' }}>
                {bar.text}
                {bar.linkUrl && <span className="ml-2 text-xs opacity-70">→ {bar.linkUrl}</span>}
              </div>
              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1 font-medium ${bar.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${bar.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {bar.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {bar.startsAt && <span>From {new Date(bar.startsAt).toLocaleDateString('en-BD')}</span>}
                  {bar.endsAt && <span>Until {new Date(bar.endsAt).toLocaleDateString('en-BD')}</span>}
                  {bar.product && <span>Product: {bar.product.name}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggle.mutate({ id: bar.id, isActive: !bar.isActive })}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                    title={bar.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => startEdit(bar)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove.mutate(bar.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
