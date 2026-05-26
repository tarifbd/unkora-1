'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Ruler } from 'lucide-react';
import { sizeGuidesApi, type SizeGuide } from '@/lib/api/products-setup';

function SizeGuideModal({ guide, onClose, onSave }: {
  guide?: SizeGuide | null;
  onClose: () => void;
  onSave: (data: Partial<SizeGuide>) => void;
}) {
  const [form, setForm] = useState({
    title: guide?.title ?? '',
    content: guide?.content ?? '',
    imageUrl: guide?.imageUrl ?? '',
    isActive: guide?.isActive ?? true,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{guide ? 'Edit Size Guide' : 'Add Size Guide'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Clothing Size Chart"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Content (HTML or Markdown) *</label>
            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={10}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="| Size | Chest | Waist |\n|------|-------|-------|\n| S    | 36    | 30    |"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Image URL (optional)</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.imageUrl}
              onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://..."
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
            {guide ? 'Save Changes' : 'Add Size Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SizeGuidesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; guide?: SizeGuide | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['size-guides', true],
    queryFn: () => sizeGuidesApi.list(true),
  });

  const create = useMutation({
    mutationFn: sizeGuidesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['size-guides'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SizeGuide> }) => sizeGuidesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['size-guides'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => sizeGuidesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['size-guides'] }); setDeleteId(null); },
  });

  const handleSave = (data: Partial<SizeGuide>) => {
    if (modal.guide) update.mutate({ id: modal.guide.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Size Guides</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{guides.length} guides</p>
        </div>
        <button
          onClick={() => setModal({ open: true, guide: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Size Guide
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Title</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Image</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {guides.map(guide => (
                <tr key={guide.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                        <Ruler className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="font-medium text-sm">{guide.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{guide._count?.products ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    {guide.imageUrl ? (
                      <img src={guide.imageUrl} alt="" className="mx-auto h-8 w-8 rounded object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${guide.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {guide.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal({ open: true, guide })}
                        className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(guide.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guides.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No size guides yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <SizeGuideModal guide={modal.guide} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Size Guide?</h3>
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
