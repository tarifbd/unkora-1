'use client';

import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Loader2, ArrowLeft, Save, ImageIcon, Upload, X, Link as LinkIcon,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, categoriesApi, type Category } from '@/lib/api/products';
import api from '@/lib/api';

interface BookDetail {
  author: string;
  publisher: string;
  isbn: string;
  language: string;
  pageCount: string;
  edition: string;
  genres: string;
  binding: string;
  translator: string;
  series: string;
}

const emptyBookDetail: BookDetail = {
  author: '', publisher: '', isbn: '', language: '',
  pageCount: '', edition: '', genres: '', binding: '',
  translator: '', series: '',
};

interface EditProductForm {
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  basePrice: string;
  salePrice: string;
  stockQuantity: string;
  lowStockAlert: string;
  sku: string;
  isFeatured: boolean;
  isActive: boolean;
  tags: string;
  categoryId: string;
}

const BOOK_CATEGORY_KEYWORDS = ['book', 'fiction', 'novel', 'literature', 'academic', 'children', 'comic', 'manga', 'religious'];
function isBookCategory(name: string) {
  return BOOK_CATEGORY_KEYWORDS.some(k => name.toLowerCase().includes(k));
}

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookSectionOpen, setBookSectionOpen] = useState(false);
  const [slugWarning, setSlugWarning] = useState(false);

  // Image state
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EditProductForm>({
    name: '',
    slug: '',
    description: '',
    shortDesc: '',
    basePrice: '',
    salePrice: '',
    stockQuantity: '',
    lowStockAlert: '',
    sku: '',
    isFeatured: false,
    isActive: true,
    tags: '',
    categoryId: '',
  });

  const [bookDetail, setBookDetail] = useState<BookDetail>(emptyBookDetail);

  // Fetch single product by ID via admin endpoint
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/products/admin/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      const primaryImg = product.images?.find((img: { isPrimary: boolean; url: string }) => img.isPrimary)?.url
        ?? product.images?.[0]?.url
        ?? '';
      const addlImgs = product.images
        ?.filter((img: { isPrimary: boolean; url: string }) => img.url !== primaryImg)
        .map((img: { url: string }) => img.url) ?? [];

      setPrimaryImageUrl(primaryImg);
      setAdditionalImages(addlImgs);

      setForm({
        name: product.name ?? '',
        slug: product.slug ?? '',
        description: product.description ?? '',
        shortDesc: product.shortDesc ?? '',
        basePrice: product.basePrice ?? '',
        salePrice: product.salePrice ?? '',
        stockQuantity: String(product.stockQuantity ?? 0),
        lowStockAlert: String(product.lowStockAlert ?? ''),
        sku: product.sku ?? '',
        isFeatured: product.isFeatured ?? false,
        isActive: product.isActive ?? true,
        tags: product.tags?.join(', ') ?? '',
        categoryId: product.category?.id ?? '',
      });

      if (product.bookDetail) {
        const bd = product.bookDetail;
        setBookDetail({
          author: bd.author ?? '',
          publisher: bd.publisher ?? '',
          isbn: bd.isbn ?? '',
          language: bd.language ?? '',
          pageCount: bd.pageCount ? String(bd.pageCount) : '',
          edition: bd.edition ?? '',
          genres: Array.isArray(bd.genres) ? bd.genres.join(', ') : (bd.genres ?? ''),
          binding: bd.binding ?? '',
          translator: bd.translator ?? '',
          series: bd.series ?? '',
        });
        setBookSectionOpen(true);
      }
    }
  }, [product]);

  // Image upload
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/image', formData);
      const url: string = response.data.url;
      if (!primaryImageUrl) {
        setPrimaryImageUrl(url);
      } else {
        setAdditionalImages(prev => [...prev, url]);
      }
    } catch {
      setUploadError('Upload failed. Try using a URL instead.');
    } finally {
      setUploading(false);
    }
  }, [primaryImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleUrlAdd = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!primaryImageUrl) {
      setPrimaryImageUrl(url);
    } else {
      setAdditionalImages(prev => [...prev, url]);
    }
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removePrimary = () => {
    if (additionalImages.length > 0) {
      setPrimaryImageUrl(additionalImages[0] ?? '');
      setAdditionalImages(prev => prev.slice(1));
    } else {
      setPrimaryImageUrl('');
    }
  };

  const removeAdditional = (idx: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== idx));
  };

  const makePrimary = (idx: number) => {
    const newPrimary = additionalImages[idx] ?? '';
    const newAdditional = additionalImages.filter((_, i) => i !== idx);
    if (primaryImageUrl) newAdditional.unshift(primaryImageUrl);
    setPrimaryImageUrl(newPrimary);
    setAdditionalImages(newAdditional);
  };

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
      slug: form.slug.trim(),
      basePrice: form.basePrice,
      stockQuantity: Number(form.stockQuantity) || 0,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    if (form.description) payload.description = form.description;
    if (form.shortDesc) payload.shortDesc = form.shortDesc;
    if (form.salePrice) payload.salePrice = form.salePrice;
    if (form.lowStockAlert) payload.lowStockAlert = Number(form.lowStockAlert);
    if (form.categoryId) payload.categoryId = form.categoryId;
    if (form.tags) payload.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (primaryImageUrl) payload.imageUrl = primaryImageUrl;

    // Book details
    const hasBookDetail = Object.values(bookDetail).some(v => v.trim() !== '');
    if (hasBookDetail) {
      payload.bookDetail = {
        ...(bookDetail.author && { author: bookDetail.author }),
        ...(bookDetail.publisher && { publisher: bookDetail.publisher }),
        ...(bookDetail.isbn && { isbn: bookDetail.isbn }),
        ...(bookDetail.language && { language: bookDetail.language }),
        ...(bookDetail.pageCount && { pageCount: Number(bookDetail.pageCount) }),
        ...(bookDetail.edition && { edition: bookDetail.edition }),
        ...(bookDetail.genres && { genres: bookDetail.genres.split(',').map(g => g.trim()).filter(Boolean) }),
        ...(bookDetail.binding && { binding: bookDetail.binding }),
        ...(bookDetail.translator && { translator: bookDetail.translator }),
        ...(bookDetail.series && { series: bookDetail.series }),
      };
    }

    updateMutation.mutate(payload);
  };

  const set = (field: keyof EditProductForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const setBook = (field: keyof BookDetail) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setBookDetail(b => ({ ...b, [field]: e.target.value }));

  const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelCls = 'mb-1 block text-sm font-medium';

  const selectedCategory = (categories as Category[] | undefined)?.find(c => c.id === form.categoryId);
  const showBookSection = selectedCategory ? isBookCategory(selectedCategory.name) : bookSectionOpen;
  const allImages = primaryImageUrl ? [primaryImageUrl, ...additionalImages] : additionalImages;

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

          {/* Image Upload */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Product Images
            </h2>

            {/* Drop zone (shown when no primary image yet) */}
            {!primaryImageUrl && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary'}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm font-medium">Drag & drop an image here, or click to select</p>
                    <p className="text-xs">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Image previews */}
            {allImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {primaryImageUrl && (
                    <div className="relative group">
                      <div className="relative h-28 w-24 overflow-hidden rounded-lg border-2 border-primary bg-muted">
                        <Image src={primaryImageUrl} alt="Primary" fill className="object-cover" />
                      </div>
                      <span className="absolute bottom-1 left-1 rounded text-[10px] bg-primary text-primary-foreground px-1 py-0.5 font-medium">Primary</span>
                      <button
                        type="button"
                        onClick={removePrimary}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {additionalImages.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <div
                        className="relative h-28 w-24 overflow-hidden rounded-lg border bg-muted cursor-pointer hover:border-primary transition-colors"
                        onClick={() => makePrimary(idx)}
                        title="Click to make primary"
                      >
                        <Image src={url} alt={`Image ${idx + 2}`} fill className="object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAdditional(idx)}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-28 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="text-[10px]">Add more</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Click a non-primary image to make it primary. Hover to remove.</p>
              </div>
            )}

            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

            {/* URL fallback */}
            <div>
              <button
                type="button"
                onClick={() => setShowUrlInput(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkIcon className="h-3 w-3" />
                {showUrlInput ? 'Hide URL input' : 'Or add image by URL'}
              </button>
              {showUrlInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                    placeholder="https://example.com/image.jpg"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleUrlAdd}
                    className="rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Basic Info */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Info</h2>

            <div>
              <label className={labelCls}>Name <span className="text-destructive">*</span></label>
              <input value={form.name} onChange={set('name')} placeholder="Product name" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>
                Slug
                <span className="ml-1 text-xs text-muted-foreground font-normal">(changing may break existing links)</span>
              </label>
              <input
                value={form.slug}
                onChange={e => { set('slug')(e); setSlugWarning(true); }}
                placeholder="product-slug"
                className={inputCls}
              />
              {slugWarning && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Changing the slug will break any existing links or bookmarks to this product.</span>
                </div>
              )}
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

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div>
                <label className={labelCls}>Low Stock Alert</label>
                <input type="number" min="0" value={form.lowStockAlert} onChange={set('lowStockAlert')} placeholder="e.g. 5" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setBookSectionOpen(o => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
            >
              <div>
                <h2 className="font-semibold text-sm">Book Details</h2>
                <p className="text-xs text-muted-foreground">
                  {showBookSection && selectedCategory ? 'Shown because a book category is selected' : 'Optional — expand for books'}
                </p>
              </div>
              {(bookSectionOpen || showBookSection) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {(bookSectionOpen || showBookSection) && (
              <div className="border-t px-5 pb-5 pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Author</label>
                    <input value={bookDetail.author} onChange={setBook('author')} className={inputCls} placeholder="e.g. Humayun Ahmed" />
                  </div>
                  <div>
                    <label className={labelCls}>Publisher</label>
                    <input value={bookDetail.publisher} onChange={setBook('publisher')} className={inputCls} placeholder="e.g. Ananya Prokashoni" />
                  </div>
                  <div>
                    <label className={labelCls}>ISBN</label>
                    <input value={bookDetail.isbn} onChange={setBook('isbn')} className={inputCls} placeholder="978-…" />
                  </div>
                  <div>
                    <label className={labelCls}>Language</label>
                    <input value={bookDetail.language} onChange={setBook('language')} className={inputCls} placeholder="e.g. Bengali" />
                  </div>
                  <div>
                    <label className={labelCls}>Page Count</label>
                    <input type="number" value={bookDetail.pageCount} onChange={setBook('pageCount')} className={inputCls} placeholder="e.g. 320" />
                  </div>
                  <div>
                    <label className={labelCls}>Edition</label>
                    <input value={bookDetail.edition} onChange={setBook('edition')} className={inputCls} placeholder="e.g. 3rd" />
                  </div>
                  <div>
                    <label className={labelCls}>Translator</label>
                    <input value={bookDetail.translator} onChange={setBook('translator')} className={inputCls} placeholder="e.g. Kabir Chowdhury" />
                  </div>
                  <div>
                    <label className={labelCls}>Series</label>
                    <input value={bookDetail.series} onChange={setBook('series')} className={inputCls} placeholder="e.g. Harry Potter" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Genres (comma-separated)</label>
                    <input value={bookDetail.genres} onChange={setBook('genres')} className={inputCls} placeholder="Fiction, Romance, Thriller" />
                  </div>
                  <div>
                    <label className={labelCls}>Binding</label>
                    <select value={bookDetail.binding} onChange={setBook('binding')} className={inputCls}>
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
