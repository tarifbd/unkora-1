'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api/products';

const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'Category required'),
  basePrice: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.string().optional(),
  // Book details
  author: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  language: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
  edition: z.string().optional(),
  genres: z.string().optional(),
  binding: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const BOOK_CATEGORY_KEYWORDS = ['book', 'fiction', 'novel', 'literature', 'academic', 'children', 'comic', 'manga', 'religious'];

function isBookCategory(name: string) {
  return BOOK_CATEGORY_KEYWORDS.some(k => name.toLowerCase().includes(k));
}

export default function NewProductPage() {
  const router = useRouter();
  const [bookSectionOpen, setBookSectionOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stockQuantity: 0, isActive: true, isFeatured: false },
  });

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories?.find((c: { id: string; name: string }) => c.id === selectedCategoryId);
  const showBookSection = selectedCategory ? isBookCategory(selectedCategory.name) : bookSectionOpen;

  const onSubmit = async (data: ProductFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      basePrice: data.basePrice,
      stockQuantity: data.stockQuantity,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (data.sku) payload.sku = data.sku;
    if (data.salePrice) payload.salePrice = data.salePrice;
    if (data.lowStockAlert) payload.lowStockAlert = data.lowStockAlert;
    if (data.shortDesc) payload.shortDesc = data.shortDesc;
    if (data.description) payload.description = data.description;

    // Book details
    if (data.author || data.publisher || data.isbn || data.language || data.pageCount || data.edition || data.genres || data.binding) {
      payload.bookDetail = {
        ...(data.author && { author: data.author }),
        ...(data.publisher && { publisher: data.publisher }),
        ...(data.isbn && { isbn: data.isbn }),
        ...(data.language && { language: data.language }),
        ...(data.pageCount && { pageCount: data.pageCount }),
        ...(data.edition && { edition: data.edition }),
        ...(data.genres && { genres: data.genres.split(',').map(g => g.trim()).filter(Boolean) }),
        ...(data.binding && { binding: data.binding }),
      };
    }

    await productsApi.create(payload);
    router.push('/admin/products');
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;
  const labelCls = 'mb-1 block text-sm font-medium';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-2xl font-bold">New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Info</h2>

          <div>
            <label className={labelCls}>Name *</label>
            <input
              {...register('name')}
              className={inputCls(errors.name)}
              onChange={e => { register('name').onChange(e); setValue('slug', autoSlug(e.target.value)); }}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Slug *</label>
            <input {...register('slug')} className={inputCls(errors.slug)} />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div>
            <label className={labelCls}>SKU</label>
            <input {...register('sku')} className={inputCls()} placeholder="Auto-generated if blank" />
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select {...register('categoryId')} className={inputCls(errors.categoryId)}>
              <option value="">Select category</option>
              {categories?.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Short Description</label>
            <input {...register('shortDesc')} className={inputCls()} placeholder="Brief product summary" />
          </div>

          <div>
            <label className={labelCls}>Full Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input {...register('tags')} className={inputCls()} placeholder="fiction, bestseller, new-arrival" />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Pricing & Stock</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Base Price (৳) *</label>
              <input type="number" step="0.01" {...register('basePrice')} className={inputCls(errors.basePrice)} />
              {errors.basePrice && <p className="mt-1 text-xs text-destructive">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Sale Price (৳) <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
              <input type="number" step="0.01" {...register('salePrice')} className={inputCls()} placeholder="Leave blank if none" />
            </div>
            <div>
              <label className={labelCls}>Stock Quantity *</label>
              <input type="number" {...register('stockQuantity')} className={inputCls(errors.stockQuantity)} />
              {errors.stockQuantity && <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Low Stock Alert</label>
              <input type="number" {...register('lowStockAlert')} className={inputCls()} placeholder="e.g. 5" />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="rounded border" defaultChecked />
              <span className="text-sm font-medium">Active (visible to customers)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} className="rounded border" />
              <span className="text-sm font-medium">Featured product</span>
            </label>
          </div>
        </div>

        {/* Book Details */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setBookSectionOpen(o => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/20 transition-colors"
          >
            <div>
              <h2 className="font-semibold">Book Details</h2>
              <p className="text-xs text-muted-foreground">
                {showBookSection && selectedCategory ? 'Shown because a book category is selected' : 'Optional — expand for books'}
              </p>
            </div>
            {(bookSectionOpen || showBookSection) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {(bookSectionOpen || showBookSection) && (
            <div className="border-t px-6 pb-6 pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Author</label>
                  <input {...register('author')} className={inputCls()} placeholder="e.g. Humayun Ahmed" />
                </div>
                <div>
                  <label className={labelCls}>Publisher</label>
                  <input {...register('publisher')} className={inputCls()} placeholder="e.g. Ananya Prokashoni" />
                </div>
                <div>
                  <label className={labelCls}>ISBN</label>
                  <input {...register('isbn')} className={inputCls()} placeholder="978-…" />
                </div>
                <div>
                  <label className={labelCls}>Language</label>
                  <input {...register('language')} className={inputCls()} placeholder="e.g. Bengali" />
                </div>
                <div>
                  <label className={labelCls}>Page Count</label>
                  <input type="number" {...register('pageCount')} className={inputCls()} placeholder="e.g. 320" />
                </div>
                <div>
                  <label className={labelCls}>Edition</label>
                  <input {...register('edition')} className={inputCls()} placeholder="e.g. 3rd" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Genres (comma-separated)</label>
                  <input {...register('genres')} className={inputCls()} placeholder="Fiction, Romance, Thriller" />
                </div>
                <div>
                  <label className={labelCls}>Binding</label>
                  <select {...register('binding')} className={inputCls()}>
                    <option value="">— Select —</option>
                    <option value="Hardcover">Hardcover</option>
                    <option value="Paperback">Paperback</option>
                    <option value="Spiral">Spiral</option>
                    <option value="Board Book">Board Book</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
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
