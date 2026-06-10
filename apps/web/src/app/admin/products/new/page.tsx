'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Upload, X, ImageIcon, Link as LinkIcon, Video, Package, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api/products';
import api from '@/lib/api';

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
  translator: z.string().optional(),
  series: z.string().optional(),
  // Product Video
  videoUrl: z.string().optional(),
  // Product Specifications
  brand: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const BOOK_CATEGORY_KEYWORDS = ['book', 'fiction', 'novel', 'literature', 'academic', 'children', 'comic', 'manga', 'religious'];

function isBookCategory(name: string) {
  return BOOK_CATEGORY_KEYWORDS.some(k => name.toLowerCase().includes(k));
}

export default function NewProductPage() {
  const router = useRouter();
  const [bookSectionOpen, setBookSectionOpen] = useState(false);
  const [specsSectionOpen, setSpecsSectionOpen] = useState(false);
  const [seoSectionOpen, setSeoSectionOpen] = useState(false);

  // Image state
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const metaTitleValue = watch('metaTitle') ?? '';
  const metaDescValue = watch('metaDescription') ?? '';

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
    if (primaryImageUrl) payload.imageUrl = primaryImageUrl;

    // Book details
    if (data.author || data.publisher || data.isbn || data.language || data.pageCount || data.edition || data.genres || data.binding || data.translator || data.series) {
      payload.bookDetail = {
        ...(data.author && { author: data.author }),
        ...(data.publisher && { publisher: data.publisher }),
        ...(data.isbn && { isbn: data.isbn }),
        ...(data.language && { language: data.language }),
        ...(data.pageCount && { pageCount: data.pageCount }),
        ...(data.edition && { edition: data.edition }),
        ...(data.genres && { genres: data.genres.split(',').map(g => g.trim()).filter(Boolean) }),
        ...(data.binding && { binding: data.binding }),
        ...(data.translator && { translator: data.translator }),
        ...(data.series && { series: data.series }),
      };
    }

    // Product Video
    if (data.videoUrl) payload.videoUrl = data.videoUrl;

    // Product Specifications
    if (data.brand || data.weight || data.dimensions || data.material || data.warranty || data.countryOfOrigin) {
      payload.specifications = {
        ...(data.brand && { brand: data.brand }),
        ...(data.weight && { weight: data.weight }),
        ...(data.dimensions && { dimensions: data.dimensions }),
        ...(data.material && { material: data.material }),
        ...(data.warranty && { warranty: data.warranty }),
        ...(data.countryOfOrigin && { countryOfOrigin: data.countryOfOrigin }),
      };
    }

    // SEO
    if (data.metaTitle || data.metaDescription || data.metaKeywords) {
      payload.seo = {
        ...(data.metaTitle && { metaTitle: data.metaTitle }),
        ...(data.metaDescription && { metaDescription: data.metaDescription }),
        ...(data.metaKeywords && { metaKeywords: data.metaKeywords }),
      };
    }

    await productsApi.create(payload);
    router.push('/admin/products');
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;
  const labelCls = 'mb-1 block text-sm font-medium';

  const allImages = primaryImageUrl ? [primaryImageUrl, ...additionalImages] : additionalImages;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-2xl font-bold">New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" /> Product Images
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
                <div className="flex flex-col gap-2">
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
              </div>
              <p className="text-xs text-muted-foreground">Click a non-primary image to make it the primary. Hover to remove.</p>
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
                  className={inputCls()}
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

        {/* Product Video */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" /> Product Video
          </h2>
          <div>
            <label className={labelCls}>Product Video URL</label>
            <input
              type="url"
              {...register('videoUrl')}
              className={inputCls()}
              placeholder="https://youtube.com/watch?v=... or direct video URL"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
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

        {/* Product Specifications */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setSpecsSectionOpen(o => !o)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
          >
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" /> Product Specifications
              </h2>
              <p className="text-xs text-muted-foreground">Optional — brand, weight, dimensions, etc.</p>
            </div>
            {specsSectionOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {specsSectionOpen && (
            <div className="border-t px-5 pb-5 pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Brand</label>
                  <input {...register('brand')} className={inputCls()} placeholder="e.g. Samsung, Nike" />
                </div>
                <div>
                  <label className={labelCls}>Weight</label>
                  <input {...register('weight')} className={inputCls()} placeholder="e.g. 500g, 1.2kg" />
                </div>
                <div>
                  <label className={labelCls}>Dimensions</label>
                  <input {...register('dimensions')} className={inputCls()} placeholder="e.g. 25 × 18 × 3 cm" />
                </div>
                <div>
                  <label className={labelCls}>Material</label>
                  <input {...register('material')} className={inputCls()} placeholder="e.g. Cotton, Plastic, Metal" />
                </div>
                <div>
                  <label className={labelCls}>Warranty</label>
                  <select {...register('warranty')} className={inputCls()}>
                    <option value="">No Warranty</option>
                    <option value="7-day return">7-day return</option>
                    <option value="30-day return">30-day return</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Country of Origin</label>
                  <input {...register('countryOfOrigin')} className={inputCls()} placeholder="e.g. Bangladesh, China" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Stock */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
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
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
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
            <div className="border-t px-5 pb-5 pt-4 space-y-4">
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
                <div>
                  <label className={labelCls}>Translator</label>
                  <input {...register('translator')} className={inputCls()} placeholder="e.g. Kabir Chowdhury" />
                </div>
                <div>
                  <label className={labelCls}>Series</label>
                  <input {...register('series')} className={inputCls()} placeholder="e.g. Harry Potter" />
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

        {/* SEO */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setSeoSectionOpen(o => !o)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
          >
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" /> SEO
              </h2>
              <p className="text-xs text-muted-foreground">Optional — meta title, description, keywords</p>
            </div>
            {seoSectionOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {seoSectionOpen && (
            <div className="border-t px-5 pb-5 pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Meta Title</label>
                  <span className={`text-xs ${metaTitleValue.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {metaTitleValue.length}/60
                  </span>
                </div>
                <input {...register('metaTitle')} className={inputCls()} placeholder="SEO page title" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Meta Description</label>
                  <span className={`text-xs ${metaDescValue.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {metaDescValue.length}/160
                  </span>
                </div>
                <textarea
                  {...register('metaDescription')}
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Brief description for search engines"
                />
              </div>
              <div>
                <label className={labelCls}>Meta Keywords</label>
                <input {...register('metaKeywords')} className={inputCls()} placeholder="keyword1, keyword2, keyword3" />
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
