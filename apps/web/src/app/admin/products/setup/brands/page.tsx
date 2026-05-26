'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Globe, CheckCircle2, XCircle, Bookmark } from 'lucide-react';
import { brandsApi, type Brand } from '@/lib/api/products-setup';

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function BrandModal({ brand, onClose, onSave }: {
  brand?: Brand | null;
  onClose: () => void;
  onSave: (data: Partial<Brand>) => void;
}) {
  const [form, setForm] = useState({
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
    description: brand?.description ?? '',
    logoUrl: brand?.logoUrl ?? '',
    website: brand?.website ?? '',
    isActive: brand?.isActive ?? true,
    sortOrder: brand?.sortOrder ?? 0,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{brand ? 'Edit Brand' : 'Add Brand'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.name}
                onChange={e => { set('name', e.target.value); set('slug', slugify(e.target.value)); }}
                placeholder="Brand name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Slug *</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="brand-slug"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={2}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Logo URL</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.logoUrl}
                onChange={e => set('logoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Website</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sort Order</label>
              <input
                type="number"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.sortOrder}
                onChange={e => set('sortOrder', Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button
            onClick={() => onSave(form)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {brand ? 'Save Changes' : 'Add Brand'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; brand?: Brand | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', true],
    queryFn: () => brandsApi.list(true),
  });

  const create = useMutation({
    mutationFn: (data: Partial<Brand>) => brandsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) => brandsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); setModal({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => brandsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); setDeleteId(null); },
  });

  const handleSave = (data: Partial<Brand>) => {
    if (modal.brand) update.mutate({ id: modal.brand.id, data });
    else create.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brands.length} total brands</p>
        </div>
        <button
          onClick={() => setModal({ open: true, brand: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Brand
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Website</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {brands.map(brand => (
                <tr key={brand.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <Bookmark className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{brand.name}</p>
                        {brand.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{brand.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{brand.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    {brand.website ? (
                      <a href={brand.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium">{brand._count?.products ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {brand.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 border">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, brand })}
                        className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(brand.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No brands yet. Click "Add Brand" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <BrandModal brand={modal.brand} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Brand?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => remove.mutate(deleteId)}
                disabled={remove.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {remove.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
