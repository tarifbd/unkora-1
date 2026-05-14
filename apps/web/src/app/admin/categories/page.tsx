'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { categoriesApi } from '@/lib/api/products';

const categorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const create = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-all'] }); setShowForm(false); reset(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-all'] }),
  });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Categories</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">New Category</h2>
          <form onSubmit={handleSubmit(data => create.mutate(data))} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input {...register('name')} className={inputCls(errors.name)}
                onChange={e => { register('name').onChange(e); setValue('slug', autoSlug(e.target.value)); }} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug *</label>
              <input {...register('slug')} className={inputCls(errors.slug)} />
              {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input {...register('description')} className={inputCls()} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Parent Category</label>
              <select {...register('parentId')} className={inputCls()}>
                <option value="">None (top-level)</option>
                {categories?.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={create.isPending}
                className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {create.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Create
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }}
                className="rounded-md border px-5 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      <div className="space-y-2">
        {categories?.map((cat: { id: string; name: string; slug: string; description?: string; _count?: { products: number } }) => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug} · {cat._count?.products ?? 0} products</p>
              </div>
            </div>
            <button onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) remove.mutate(cat.id); }}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
