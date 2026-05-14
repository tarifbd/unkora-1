'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api/products';

const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  categoryId: z.string().min(1, 'Category required'),
  basePrice: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stockQuantity: 0, isFeatured: false },
  });

  const nameValue = watch('name');

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const onSubmit = async (data: ProductFormData) => {
    await productsApi.create({
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
    router.push('/admin/products');
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-2xl font-bold">New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Info</h2>
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
            <label className="mb-1 block text-sm font-medium">Category *</label>
            <select {...register('categoryId')} className={inputCls(errors.categoryId)}>
              <option value="">Select category</option>
              {categories?.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Short Description</label>
            <input {...register('shortDesc')} className={inputCls()} placeholder="Brief product summary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Full Description</label>
            <textarea {...register('description')} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
            <input {...register('tags')} className={inputCls()} placeholder="fiction, bestseller, new-arrival" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Pricing & Stock</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Base Price (৳) *</label>
              <input type="number" step="0.01" {...register('basePrice')} className={inputCls(errors.basePrice)} />
              {errors.basePrice && <p className="mt-1 text-xs text-destructive">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sale Price (৳)</label>
              <input type="number" step="0.01" {...register('salePrice')} className={inputCls()} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Stock Quantity *</label>
              <input type="number" {...register('stockQuantity')} className={inputCls(errors.stockQuantity)} />
              {errors.stockQuantity && <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p>}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isFeatured')} className="rounded border" />
            <span className="text-sm font-medium">Featured product</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Product
          </button>
          <Link href="/admin/products" className="rounded-md border px-6 py-2.5 text-sm hover:bg-accent transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
