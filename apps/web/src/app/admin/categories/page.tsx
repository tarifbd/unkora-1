'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, ChevronRight, Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import { categoriesApi } from '@/lib/api/products';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { products: number };
  children?: Category[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
};

function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-admin-all'],
    queryFn: () => api.get('/categories/all?includeInactive=true').then(r => r.data.data as Category[]),
  });

  // Also load public categories (root+children) for tree
  const { data: rootCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/categories', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/categories/${id}`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      resetForm();
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/categories/${id}`, { isActive }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      if (editingId) resetForm();
    },
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugTouched(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setSlugTouched(true);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive ?? true,
    });
  }

  function handleNameChange(val: string) {
    setForm(f => ({ ...f, name: val, slug: slugTouched ? f.slug : autoSlug(val) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || undefined,
      parentId: form.parentId || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // Build tree: roots with children nested
  const roots = categories.filter(c => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">{categories.length} categories total</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Category Tree */}
        <div className="lg:col-span-3 rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Category Tree</p>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> New
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="divide-y">
            {roots.map(parent => (
              <div key={parent.id}>
                {/* Parent row */}
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{parent.name}</p>
                      <p className="text-xs text-muted-foreground">/{parent.slug} · {parent._count?.products ?? 0} products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => toggleActive.mutate({ id: parent.id, isActive: !(parent.isActive ?? true) })}
                      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${(parent.isActive ?? true) ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${(parent.isActive ?? true) ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => startEdit(parent)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete "${parent.name}"?`)) deleteMutation.mutate(parent.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                {childrenOf(parent.id).map(child => (
                  <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10 bg-muted/10 hover:bg-muted/20 transition-colors border-t border-dashed border-muted">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">/{child.slug} · {child._count?.products ?? 0} products</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => toggleActive.mutate({ id: child.id, isActive: !(child.isActive ?? true) })}
                        className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${(child.isActive ?? true) ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      >
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${(child.isActive ?? true) ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <button onClick={() => startEdit(child)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${child.name}"?`)) deleteMutation.mutate(child.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {!isLoading && !categories.length && (
            <div className="p-8 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p>No categories yet</p>
            </div>
          )}
        </div>

        {/* Right: Create / Edit Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-5 space-y-4 sticky top-4">
            <h2 className="font-semibold">{editingId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Fiction"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                  className={inputCls}
                  placeholder="e.g. fiction"
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers and hyphens only"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">None (top-level)</option>
                  {roots.filter(r => r.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className={inputCls}
                  min="0"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border"
                />
                <span className="text-sm font-medium">Active</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
