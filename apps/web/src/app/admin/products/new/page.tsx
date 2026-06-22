'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Loader2, ChevronDown, ChevronUp, Upload, X,
  ImageIcon, Link as LinkIcon, Video, Package, Search,
  Plus, Trash2, GripVertical, Star, Tag, Globe, Truck,
  DollarSign, Layers, Settings, BookOpen, Play, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api/products';
import api from '@/lib/api';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

/* ─── Schema ──────────────────────────────────────────────────── */
const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'Category required'),
  basePrice: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  shortDesc: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  preorderNote: z.string().optional(),
  tags: z.string().optional(),
  // Book
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
  // Specs
  brand: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  // Shipping
  shippingWeight: z.string().optional(),
  shippingClass: z.string().optional(),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  // Purchase note
  purchaseNote: z.string().optional(),
});
type ProductFormData = z.infer<typeof productSchema>;

/* ─── Helpers ─────────────────────────────────────────────────── */
const BOOK_KEYWORDS = ['book', 'fiction', 'novel', 'literature', 'academic', 'children', 'comic', 'manga', 'religious'];
const isBookCat = (name: string) => BOOK_KEYWORDS.some(k => name.toLowerCase().includes(k));
const autoSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

/* ─── Variant types ───────────────────────────────────────────── */
interface VariantOption { name: string; values: string[] }
interface VariantRow { combo: string; sku: string; price: string; stock: string; imageUrl: string; enabled: boolean }

function generateVariantRows(options: VariantOption[]): VariantRow[] {
  const filled = options.filter(o => o.values.length > 0);
  if (!filled.length) return [];
  const combos: string[][] = filled.reduce<string[][]>((acc, opt) => {
    if (!acc.length) return opt.values.map(v => [v]);
    return acc.flatMap(a => opt.values.map(v => [...a, v]));
  }, []);
  return combos.map(c => ({ combo: c.join(' / '), sku: '', price: '', stock: '', imageUrl: '', enabled: true }));
}

/* ─── Attribute types ─────────────────────────────────────────── */
interface Attribute { key: string; value: string }

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({
  title, subtitle, icon: Icon, open, onToggle, collapsible = true, children, badge,
}: {
  title: string; subtitle?: string; icon: React.ElementType; open?: boolean;
  onToggle?: () => void; collapsible?: boolean; children: React.ReactNode; badge?: string;
}) {
  const isOpen = collapsible ? open : true;
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm">{title}</h2>
                {badge && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
              </div>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">{title}</h2>
              {badge && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      )}
      {isOpen && <div className="px-5 pb-5 pt-4 space-y-4 border-t">{children}</div>}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function NewProductPage() {
  const router = useRouter();

  // Section open state
  const [s, setS] = useState({
    media: true, basic: true, description: true, pricing: true,
    variants: false, book: false, specs: false, shipping: false, attrs: false, seo: false,
  });
  const toggleS = (k: keyof typeof s) => setS(prev => ({ ...prev, [k]: !prev[k] }));

  // Media state
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Description state
  const [description, setDescription] = useState('');

  // Variants state
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([
    { name: 'Size', values: [] },
  ]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [variantsGenerated, setVariantsGenerated] = useState(false);

  // Attributes
  const [attrs, setAttrs] = useState<Attribute[]>([{ key: '', value: '' }]);

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stockQuantity: 0, isActive: true, isFeatured: false },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories?.find((c: { id: string; name: string }) => c.id === selectedCategoryId);
  const showBookSection = selectedCategory ? isBookCat(selectedCategory.name) : s.book;
  const metaTitleVal = watch('metaTitle') ?? '';
  const metaDescVal = watch('metaDescription') ?? '';

  /* ── Image upload ── */
  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Image files only'); return; }
    setUploading(true); setUploadError(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/upload/image', fd);
      setImages(prev => [...prev, res.data.url as string]);
    } catch {
      setUploadError('Upload failed — try URL instead');
    } finally { setUploading(false); }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(f => { if (f.type.startsWith('image/')) uploadImage(f); });
  }, [uploadImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(f => uploadImage(f));
    e.target.value = '';
  };

  const handleUrlAdd = () => {
    const url = urlInput.trim();
    if (!url) return;
    setImages(prev => [...prev, url]);
    setUrlInput(''); setShowUrlInput(false);
  };

  const moveImage = (from: number, to: number) => {
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      if (item) arr.splice(to, 0, item);
      return arr;
    });
  };

  /* ── Video upload ── */
  const handleVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/upload/video', fd);
      setVideoFile(res.data.url as string);
    } catch {
      // fallback: create local object URL for preview
      setVideoFile(URL.createObjectURL(file));
    } finally { setUploadingVideo(false); }
    e.target.value = '';
  }, []);

  /* ── Variants ── */
  const addVariantOption = () => setVariantOptions(prev => [...prev, { name: '', values: [] }]);
  const removeVariantOption = (i: number) => setVariantOptions(prev => prev.filter((_, idx) => idx !== i));
  const setOptionName = (i: number, name: string) => setVariantOptions(prev => prev.map((o, idx) => idx === i ? { ...o, name } : o));
  const setOptionValues = (i: number, raw: string) => setVariantOptions(prev => prev.map((o, idx) => idx === i ? { ...o, values: raw.split(',').map(v => v.trim()).filter(Boolean) } : o));
  const generateVariants = () => { setVariantRows(generateVariantRows(variantOptions)); setVariantsGenerated(true); };
  const updateVariantRow = (i: number, field: keyof VariantRow, val: string | boolean) =>
    setVariantRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  /* ── Attributes ── */
  const addAttr = () => setAttrs(prev => [...prev, { key: '', value: '' }]);
  const removeAttr = (i: number) => setAttrs(prev => prev.filter((_, idx) => idx !== i));
  const setAttr = (i: number, field: 'key' | 'value', val: string) =>
    setAttrs(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));

  /* ── Submit ── */
  const onSubmit = async (data: ProductFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name, slug: data.slug, categoryId: data.categoryId,
      basePrice: data.basePrice, stockQuantity: data.stockQuantity,
      isActive: data.isActive ?? true, isFeatured: data.isFeatured ?? false,
      isPreorder: data.isPreorder ?? false,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      description,
    };
    if (data.sku) payload.sku = data.sku;
    if (data.salePrice) payload.salePrice = data.salePrice;
    if (data.lowStockAlert) payload.lowStockAlert = data.lowStockAlert;
    if (data.shortDesc) payload.shortDesc = data.shortDesc;
    if (data.preorderNote) payload.preorderNote = data.preorderNote;
    if (data.purchaseNote) payload.purchaseNote = data.purchaseNote;
    if (images.length > 0) payload.imageUrl = images[0];
    if (images.length > 1) payload.images = images.slice(1);
    if (videoFile || videoUrl) payload.videoUrl = videoFile || videoUrl;

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

    if (data.shippingWeight || data.shippingClass) {
      payload.shipping = {
        ...(data.shippingWeight && { weight: data.shippingWeight }),
        ...(data.shippingClass && { class: data.shippingClass }),
      };
    }

    const filledAttrs = attrs.filter(a => a.key && a.value);
    if (filledAttrs.length > 0) payload.attributes = filledAttrs;

    if (variantsGenerated && variantRows.length > 0) {
      payload.variants = variantRows.filter(r => r.enabled).map(r => ({
        combo: r.combo,
        ...(r.sku && { sku: r.sku }),
        ...(r.price && { price: parseFloat(r.price) }),
        ...(r.stock && { stock: parseInt(r.stock) }),
        ...(r.imageUrl && { imageUrl: r.imageUrl }),
      }));
    }

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

  const inp = (err?: { message?: string }) =>
    `w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? 'border-destructive focus:ring-destructive/20' : 'focus:border-primary/50'}`;
  const lbl = 'mb-1 block text-sm font-medium text-foreground';

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-bold text-xl">New Product</h1>
          <p className="text-xs text-muted-foreground">Fill in the details below to create a new product</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── MEDIA ── */}
        <Section title="Media" subtitle="Images and video for your product" icon={ImageIcon} open={s.media} onToggle={() => toggleS('media')}>
          {/* Image grid */}
          <div>
            <label className={lbl}>Product Images</label>
            <p className="text-xs text-muted-foreground mb-3">First image is the primary. Drag to reorder. Max 10 images.</p>

            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`relative h-28 w-24 overflow-hidden rounded-xl border-2 cursor-pointer transition-all ${idx === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary'}`}
                    onClick={() => setPreviewImg(url)}
                  >
                    <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" unoptimized />
                    {idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary text-[9px] text-white text-center py-0.5 font-bold">PRIMARY</div>
                    )}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {idx > 0 && (
                    <button type="button" onClick={() => moveImage(idx, 0)}
                      className="absolute bottom-6 inset-x-0 text-[9px] text-center bg-black/50 text-white py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Set primary
                    </button>
                  )}
                </div>
              ))}

              {/* Upload slot */}
              {images.length < 10 && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`h-28 w-24 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all
                    ${dragOver ? 'border-primary bg-primary/5 scale-105' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 text-center leading-tight">Upload<br />or drop</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {uploadError && <p className="text-xs text-destructive mb-2">{uploadError}</p>}

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowUrlInput(v => !v)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <LinkIcon className="h-3 w-3" /> Add by URL
              </button>
              {images.length > 0 && (
                <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''} added</span>
              )}
            </div>
            {showUrlInput && (
              <div className="flex gap-2 mt-2">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                  placeholder="https://example.com/image.jpg" className={inp()} />
                <button type="button" onClick={handleUrlAdd}
                  className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap">Add</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>

          {/* Video */}
          <div className="pt-2 border-t">
            <label className={lbl + ' flex items-center gap-2'}><Play className="h-4 w-4 text-muted-foreground" /> Product Video</label>
            <div className="space-y-2">
              {videoFile ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-xs">
                  <video src={videoFile} controls className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setVideoFile(null)}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => videoRef.current?.click()}
                    disabled={uploadingVideo}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                    {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Video
                  </button>
                  <span className="text-xs text-muted-foreground">or</span>
                  <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="YouTube / Vimeo / direct video URL"
                    className={inp() + ' flex-1'} />
                </div>
              )}
              {videoUrl && !videoFile && (
                <div className="text-xs text-muted-foreground">Video URL: {videoUrl}</div>
              )}
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
            </div>
          </div>
        </Section>

        {/* ── BASIC INFO ── */}
        <Section title="Basic Info" subtitle="Name, slug, category and tags" icon={Tag} open={s.basic} onToggle={() => toggleS('basic')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl}>Product Name *</label>
              <input {...register('name')} className={inp(errors.name)}
                onChange={e => { register('name').onChange(e); setValue('slug', autoSlug(e.target.value)); }}
                placeholder="e.g. হুমায়ূন আহমেদ সমগ্র" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className={lbl}>Slug *</label>
              <input {...register('slug')} className={inp(errors.slug)} placeholder="humayun-ahmed-somogro" />
              {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div>
              <label className={lbl}>SKU <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
              <input {...register('sku')} className={inp()} placeholder="Auto-generated if blank" />
            </div>
            <div>
              <label className={lbl}>Category *</label>
              <select {...register('categoryId')} className={inp(errors.categoryId)}>
                <option value="">Select category</option>
                {categories?.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className={lbl}>Tags <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span></label>
              <input {...register('tags')} className={inp()} placeholder="fiction, bestseller, humayun" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Short Description <span className="text-xs text-muted-foreground font-normal">(shown in product cards)</span></label>
              <textarea {...register('shortDesc')} rows={2}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="One-liner summary of the product" />
            </div>
          </div>
        </Section>

        {/* ── DESCRIPTION (Rich Text) ── */}
        <Section title="Description" subtitle="Full product description with rich formatting" icon={BookOpen} open={s.description} onToggle={() => toggleS('description')}>
          <RichTextEditor value={description} onChange={setDescription} placeholder="Write a detailed product description — use headings, bold, lists, links, and more..." minHeight={320} />
        </Section>

        {/* ── PRICING & STOCK ── */}
        <Section title="Pricing & Stock" subtitle="Price, sale price, and inventory" icon={DollarSign} collapsible={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Base Price (৳) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">৳</span>
                <input type="number" step="0.01" {...register('basePrice')} className={inp(errors.basePrice) + ' pl-7'} placeholder="0.00" />
              </div>
              {errors.basePrice && <p className="mt-1 text-xs text-destructive">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className={lbl}>Sale Price (৳) <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">৳</span>
                <input type="number" step="0.01" {...register('salePrice')} className={inp() + ' pl-7'} placeholder="Leave blank if no discount" />
              </div>
            </div>
            <div>
              <label className={lbl}>Stock Quantity *</label>
              <input type="number" {...register('stockQuantity')} className={inp(errors.stockQuantity)} />
              {errors.stockQuantity && <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p>}
            </div>
            <div>
              <label className={lbl}>Low Stock Alert <span className="text-xs text-muted-foreground font-normal">(notify when below)</span></label>
              <input type="number" {...register('lowStockAlert')} className={inp()} placeholder="e.g. 5" />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 border-t">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" {...register('isActive')} defaultChecked className="h-4 w-4 accent-primary rounded" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Active</p>
                <p className="text-xs text-muted-foreground">Visible to customers</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" {...register('isFeatured')} className="h-4 w-4 accent-primary rounded" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Featured</p>
                <p className="text-xs text-muted-foreground">Show on homepage</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" {...register('isPreorder')} className="h-4 w-4 accent-primary rounded" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Pre-order</p>
                <p className="text-xs text-muted-foreground">Reserve before stock arrives</p>
              </div>
            </label>
          </div>
          <div>
            <label className={lbl}>Pre-order Note</label>
            <input {...register('preorderNote')} className={inp()} placeholder="e.g. Ships within 2 weeks of release" />
          </div>
          <div>
            <label className={lbl}>Purchase Note <span className="text-xs text-muted-foreground font-normal">(shown to customer after purchase)</span></label>
            <input {...register('purchaseNote')} className={inp()} placeholder="e.g. Thank you! Check your email for download link." />
          </div>
        </Section>

        {/* ── VARIANTS ── */}
        <Section title="Variants" subtitle="Sizes, colors, or custom options with individual pricing" icon={Layers} open={s.variants} onToggle={() => toggleS('variants')} badge={variantRows.filter(r => r.enabled).length > 0 ? `${variantRows.filter(r => r.enabled).length} variants` : undefined}>
          <div className="space-y-4">
            {variantOptions.map((opt, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Option Name</label>
                    <input value={opt.name} onChange={e => setOptionName(i, e.target.value)}
                      className={inp()} placeholder="e.g. Size, Color, Material" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Values <span className="text-[10px]">(comma-separated)</span></label>
                    <input value={opt.values.join(', ')} onChange={e => setOptionValues(i, e.target.value)}
                      className={inp()} placeholder="e.g. S, M, L, XL or Red, Blue, Green" />
                  </div>
                </div>
                <button type="button" onClick={() => removeVariantOption(i)} className="mt-6 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <button type="button" onClick={addVariantOption}
                className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                <Plus className="h-4 w-4" /> Add Option
              </button>
              <button type="button" onClick={generateVariants}
                className="flex items-center gap-2 text-sm bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors font-medium">
                Generate Variants
              </button>
            </div>

            {variantRows.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-muted-foreground uppercase border-b">
                  {variantRows.length} variant combinations
                </div>
                <div className="divide-y max-h-80 overflow-y-auto">
                  {variantRows.map((row, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${!row.enabled ? 'opacity-50' : ''}`}>
                      <input type="checkbox" checked={row.enabled} onChange={e => updateVariantRow(i, 'enabled', e.target.checked)}
                        className="accent-primary h-4 w-4 flex-shrink-0" />
                      <span className="font-medium w-32 flex-shrink-0">{row.combo}</span>
                      <input value={row.sku} onChange={e => updateVariantRow(i, 'sku', e.target.value)}
                        placeholder="SKU" className="border rounded-lg px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-bold">৳</span>
                        <input value={row.price} onChange={e => updateVariantRow(i, 'price', e.target.value)}
                          placeholder="Price" type="number" className="border rounded-lg pl-5 pr-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      </div>
                      <input value={row.stock} onChange={e => updateVariantRow(i, 'stock', e.target.value)}
                        placeholder="Stock" type="number" className="border rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── BOOK DETAILS ── */}
        <Section title="Book Details" subtitle={showBookSection && selectedCategory ? 'Auto-shown for book categories' : 'Optional — fill for book products'} icon={BookOpen} open={s.book || showBookSection} onToggle={() => toggleS('book')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Author</label><input {...register('author')} className={inp()} placeholder="e.g. Humayun Ahmed" /></div>
            <div><label className={lbl}>Publisher</label><input {...register('publisher')} className={inp()} placeholder="e.g. Ananya Prokashoni" /></div>
            <div><label className={lbl}>ISBN</label><input {...register('isbn')} className={inp()} placeholder="978-…" /></div>
            <div><label className={lbl}>Language</label><input {...register('language')} className={inp()} placeholder="Bengali, English…" /></div>
            <div><label className={lbl}>Page Count</label><input type="number" {...register('pageCount')} className={inp()} placeholder="320" /></div>
            <div><label className={lbl}>Edition</label><input {...register('edition')} className={inp()} placeholder="1st, 2nd, Revised…" /></div>
            <div><label className={lbl}>Translator</label><input {...register('translator')} className={inp()} placeholder="Translator name" /></div>
            <div><label className={lbl}>Series</label><input {...register('series')} className={inp()} placeholder="e.g. Harry Potter" /></div>
            <div className="sm:col-span-2"><label className={lbl}>Genres <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span></label><input {...register('genres')} className={inp()} placeholder="Fiction, Romance, Thriller" /></div>
            <div>
              <label className={lbl}>Binding</label>
              <select {...register('binding')} className={inp()}>
                <option value="">— Select —</option>
                <option value="Hardcover">Hardcover</option>
                <option value="Paperback">Paperback</option>
                <option value="Spiral">Spiral</option>
                <option value="Board Book">Board Book</option>
                <option value="Ebook">Ebook</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── SPECIFICATIONS ── */}
        <Section title="Specifications" subtitle="Brand, weight, dimensions, material, warranty" icon={Settings} open={s.specs} onToggle={() => toggleS('specs')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Brand</label><input {...register('brand')} className={inp()} placeholder="e.g. Samsung, Nike" /></div>
            <div><label className={lbl}>Weight</label><input {...register('weight')} className={inp()} placeholder="e.g. 500g, 1.2kg" /></div>
            <div><label className={lbl}>Dimensions</label><input {...register('dimensions')} className={inp()} placeholder="25 × 18 × 3 cm" /></div>
            <div><label className={lbl}>Material</label><input {...register('material')} className={inp()} placeholder="Cotton, Plastic, Metal…" /></div>
            <div>
              <label className={lbl}>Warranty</label>
              <select {...register('warranty')} className={inp()}>
                <option value="">No Warranty</option>
                <option value="7-day return">7-day return</option>
                <option value="30-day return">30-day return</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="2 years">2 years</option>
              </select>
            </div>
            <div><label className={lbl}>Country of Origin</label><input {...register('countryOfOrigin')} className={inp()} placeholder="Bangladesh, China…" /></div>
          </div>
        </Section>

        {/* ── SHIPPING ── */}
        <Section title="Shipping" subtitle="Shipping weight and class for courier calculation" icon={Truck} open={s.shipping} onToggle={() => toggleS('shipping')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Shipping Weight</label>
              <input {...register('shippingWeight')} className={inp()} placeholder="e.g. 0.5 kg (with packaging)" />
            </div>
            <div>
              <label className={lbl}>Shipping Class</label>
              <select {...register('shippingClass')} className={inp()}>
                <option value="">Standard</option>
                <option value="light">Light (under 500g)</option>
                <option value="medium">Medium (0.5–2kg)</option>
                <option value="heavy">Heavy (2–10kg)</option>
                <option value="bulky">Bulky (10kg+)</option>
                <option value="fragile">Fragile</option>
                <option value="digital">Digital / No shipping</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── CUSTOM ATTRIBUTES ── */}
        <Section title="Custom Attributes" subtitle="Add any extra key-value product details" icon={Settings} open={s.attrs} onToggle={() => toggleS('attrs')} badge={attrs.filter(a => a.key).length > 0 ? `${attrs.filter(a => a.key).length}` : undefined}>
          <div className="space-y-2">
            {attrs.map((attr, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={attr.key} onChange={e => setAttr(i, 'key', e.target.value)}
                  placeholder="Attribute name" className={inp() + ' flex-1'} />
                <input value={attr.value} onChange={e => setAttr(i, 'value', e.target.value)}
                  placeholder="Value" className={inp() + ' flex-1'} />
                <button type="button" onClick={() => removeAttr(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addAttr}
              className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add Attribute
            </button>
          </div>
        </Section>

        {/* ── SEO ── */}
        <Section title="SEO" subtitle="Meta title, description and keywords for search engines" icon={Globe} open={s.seo} onToggle={() => toggleS('seo')}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={lbl}>Meta Title</label>
                <span className={`text-xs ${metaTitleVal.length > 60 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{metaTitleVal.length}/60</span>
              </div>
              <input {...register('metaTitle')} className={inp()} placeholder="SEO page title (60 chars max)" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={lbl}>Meta Description</label>
                <span className={`text-xs ${metaDescVal.length > 160 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{metaDescVal.length}/160</span>
              </div>
              <textarea {...register('metaDescription')} rows={2}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Search engine description (160 chars max)" />
            </div>
            <div>
              <label className={lbl}>Meta Keywords <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span></label>
              <input {...register('metaKeywords')} className={inp()} placeholder="keyword1, keyword2, keyword3" />
            </div>
            {/* SERP Preview */}
            {(metaTitleVal || metaDescVal) && (
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Google Preview</p>
                <p className="text-blue-600 text-sm font-medium truncate">{metaTitleVal || 'Product Title'}</p>
                <p className="text-green-600 text-xs">unkora.shop/books/{watch('slug') || 'product-slug'}</p>
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">{metaDescVal || 'Product description will appear here...'}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="rounded-xl border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {/* Image preview modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl max-h-[80vh] p-2">
            <Image src={previewImg} alt="Preview" width={800} height={600} className="rounded-xl object-contain max-h-[75vh]" unoptimized />
            <button onClick={() => setPreviewImg(null)}
              className="absolute top-4 right-4 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
