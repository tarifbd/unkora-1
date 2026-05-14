'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Save, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, categoriesApi, type Category } from '@/lib/api/products';

interface EditProductForm {
  name: string;
  description: string;
  shortDesc: string;
  basePrice: string;
  salePrice: string;
  stockQuantity: string;
  isFeatured: boolean;
  isActive: boolean;
  tags: string;
  categoryId: string;
  imageUrl: string;
}

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditProductForm>({
    name: '',
    description: '',
    shortDesc: '',
    basePrice: '',
    salePrice: '',
    stockQuantity: '',
    isFeatured: false,
    isActive: true,
    tags: '',
    categoryId: '',
    imageUrl: '',
  });

  // Fetch products list and find by id
  const { data: productList, isLoading } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: () => productsApi.getAll({ limit: 1000 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const product = productList?.data?.find(p => p.id === id);

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        shortDesc: product.shortDesc ?? '',
        basePrice: product.basePrice,
        salePrice: product.salePrice ?? '',
        stockQuantity: String(product.stockQuantity),
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        tags: product.tags?.join(', ') ?? '',
        categoryId: product.category?.id ?? '',
        imageUrl: product.images?.find(img => img.isPrimary)?.url ?? product.images?.[0]?.url ?? '',
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.update(id, data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    },
    onError: () => setError('Failed to save changes. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.basePrice || Number(form.basePrice) <= 0) { setError('Base price must be greater than 0.'); return; }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      basePrice: form.basePrice,
      stockQuantity: Number(form.stockQuantity) || 0,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    if (form.description) payload.description = form.description;
    if (form.shortDesc) payload.shortDesc = form.shortDesc;
    if (form.salePrice) payload.salePrice = form.salePrice;
    if (form.categoryId) payload.categoryId = form.categoryId;
    if (form.tags) payload.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (form.imageUrl) payload.imageUrl = form.imageUrl;

    updateMutation.mutate(payload);
  };

  const set = (field: keyof EditProductForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelCls = 'mb-1 block text-sm font-medium';

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!product) return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link href="/admin/products" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
        Back to Products
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Products
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-serif text-xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Info</h2>

            <div>
              <label className={labelCls}>Name <span className="text-destructive">*</span></label>
              <input value={form.name} onChange={set('name')} placeholder="Product name" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Short Description</label>
              <input value={form.shortDesc} onChange={set('shortDesc')} placeholder="Brief summary shown on cards" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={5}
                placeholder="Full product description..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>Tags <span className="text-muted-foreground text-xs font-normal">(comma-separated)</span></label>
              <input value={form.tags} onChange={set('tags')} placeholder="fiction, bestseller, new arrival" className={inputCls} />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pricing & Inventory</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Base Price (৳) <span className="text-destructive">*</span></label>
                <input type="number" min="0" step="0.01" value={form.basePrice} onChange={set('basePrice')} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sale Price (৳) <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                <input type="number" min="0" step="0.01" value={form.salePrice} onChange={set('salePrice')} placeholder="Leave blank if none" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Stock Quantity</label>
                <input type="number" min="0" value={form.stockQuantity} onChange={set('stockQuantity')} placeholder="0" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Primary Image
            </h2>

            <div className="flex gap-4 items-start">
              {form.imageUrl ? (
                <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted border">
                  <Image src={form.imageUrl} alt="Preview" fill className="object-cover" onError={() => setForm(f => ({ ...f, imageUrl: '' }))} />
                </div>
              ) : (
                <div className="flex h-24 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-3xl">
                  📦
                </div>
              )}
              <div className="flex-1">
                <label className={labelCls}>Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={set('imageUrl')}
                  placeholder="https://example.com/image.jpg"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">Enter a URL for the primary product image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish Settings */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Settings</h2>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-accent transition-colors">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Visible to customers</p>
              </div>
              <div
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-accent transition-colors">
              <div>
                <p className="text-sm font-medium">Featured</p>
                <p className="text-xs text-muted-foreground">Show on homepage</p>
              </div>
              <div
                onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.isFeatured ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {/* Category */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Category</h2>
            <select value={form.categoryId} onChange={set('categoryId')} className={inputCls}>
              <option value="">— Select category —</option>
              {(categories as Category[] | undefined)?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Product Meta */}
          <div className="rounded-xl border bg-muted/30 p-4 text-xs space-y-1 text-muted-foreground">
            <p><span className="font-medium text-foreground">SKU:</span> {product.sku}</p>
            <p><span className="font-medium text-foreground">ID:</span> {product.id.slice(0, 8)}…</p>
            <p><span className="font-medium text-foreground">Slug:</span> {product.slug}</p>
          </div>

          {/* Save Button */}
          <div className="space-y-2">
            {error && <p className="text-xs text-destructive">{error}</p>}
            {saved && <p className="text-xs text-green-600">Saved! Redirecting...</p>}
            <button
              type="submit"
              disabled={updateMutation.isPending || saved}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
            <Link
              href="/admin/products"
              className="flex w-full items-center justify-center rounded-md border py-2.5 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
