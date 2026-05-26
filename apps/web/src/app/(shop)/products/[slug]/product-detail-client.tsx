'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Loader2, ArrowLeft, BookOpen, Package, Zap } from 'lucide-react';
import Link from 'next/link';

import { productsApi } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';
import { ProductReviews } from '@/components/product/product-reviews';
import { ProductCard } from '@/components/product/product-card';
import { WishlistButton } from '@/components/product/wishlist-button';
import { trackViewProduct, trackAddToCart } from '@/lib/analytics';
import { useLanguage } from '@/lib/i18n/language-context';

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
  });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const { addItem } = useCart();
  const { openCart } = useCartStore();
  const { t } = useLanguage();
  const buyBtnRef = useRef<HTMLDivElement>(null);

  // Show sticky bar when the main buy button scrolls out of view
  useEffect(() => {
    if (!buyBtnRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => setStickyVisible(!(entries[0]?.isIntersecting ?? true)),
      { threshold: 0 }
    );
    observer.observe(buyBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    if (!product) return;
    trackViewProduct({
      productId: product.id,
      name: product.name,
      price: Number(product.salePrice ?? product.basePrice),
      category: product.category?.name,
    });
  }, [product]);

  if (isLoading) return (
    <div className="container py-12 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!product) return <div className="container py-12 text-center text-muted-foreground">{t.productDetail.notFound}</div>;

  const price = Number(product.salePrice ?? product.basePrice);
  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);

  const handleAddToCart = () => {
    addItem.mutate({
      productId: product.id,
      quantity: qty,
      guestData: {
        name: product.name,
        price: Number(product.salePrice ?? product.basePrice),
        image: product.images[0]?.url,
        slug: product.slug,
      },
    });
    trackAddToCart({ productId: product.id, name: product.name, price });
    openCart();
  };

  return (
    <div className="container py-8">
      <Link href="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t.productDetail.backToProducts}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images[activeImg] ? (
              <Image src={product.images[activeImg]?.url ?? ''} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">📦</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${i === activeImg ? 'border-primary' : 'border-transparent'}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="mt-1 font-serif text-2xl font-bold leading-tight md:text-3xl">{product.name}</h1>
            {product.bookDetail && (
              <p className="mt-1 text-muted-foreground">by <span className="font-medium text-foreground">{product.bookDetail.author}</span></p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-600">{formatCurrency(price)}</span>
            {hasDiscount && <span className="text-base text-muted-foreground line-through">{formatCurrency(Number(product.basePrice))}</span>}
          </div>

          {product.shortDesc && <p className="text-muted-foreground">{product.shortDesc}</p>}

          {/* Book Details */}
          {product.bookDetail && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><BookOpen className="h-4 w-4" /> {t.productDetail.bookDetails}</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  [t.productDetail.author, product.bookDetail.author],
                  [t.productDetail.publisher, product.bookDetail.publisher],
                  [t.productDetail.language, product.bookDetail.language],
                  [t.productDetail.pages, product.bookDetail.pageCount],
                  [t.productDetail.edition, product.bookDetail.edition],
                  [t.productDetail.isbn, product.bookDetail.isbn],
                  [t.productDetail.binding, product.bookDetail.binding],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              {product.bookDetail.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {product.bookDetail.genres.map(g => (
                    <span key={g} className="rounded-full bg-background border px-2 py-0.5 text-xs">{g}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            {product.stockQuantity > 0
              ? <span className="text-green-600 font-medium">{t.productDetail.inStock} ({product.stockQuantity} available)</span>
              : <span className="text-destructive font-medium">{t.productDetail.outOfStock}</span>}
          </div>

          {/* Qty + Add to Cart + Wishlist */}
          {product.stockQuantity > 0 && (
            <div ref={buyBtnRef} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="hover:text-brand-600 transition-colors"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-[24px] text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stockQuantity, qty + 1))} className="hover:text-brand-600 transition-colors"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={addItem.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {addItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  {t.productDetail.addToCart}
                </button>
                <WishlistButton
                  productId={product.id}
                  className="h-10 w-10 rounded-md border hover:bg-accent transition-colors"
                />
              </div>
              <Link
                href={`/checkout?productId=${product.id}&qty=${qty}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200"
              >
                <Zap className="h-4 w-4" /> এখনই কিনুন
              </Link>
            </div>
          )}
          {product.stockQuantity === 0 && (
            <div className="flex items-center gap-3">
              <WishlistButton
                productId={product.id}
                className="h-10 w-10 rounded-md border hover:bg-accent transition-colors"
              />
            </div>
          )}

          {product.description && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold">{t.productDetail.description}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <RelatedProducts categorySlug={product.category.slug} currentId={product.id} />

      {/* ── Mobile sticky buy bar — shows when main button scrolls out of view ── */}
      {product.stockQuantity > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Notification-style top hint */}
          <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-gray-900/90 backdrop-blur-sm px-4 py-2.5 shadow-2xl">
            <div className="relative flex-shrink-0">
              {product.images[0] && (
                <Image src={product.images[0].url} alt="" width={36} height={36} className="rounded-lg object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{product.name}</p>
              <p className="text-orange-400 text-xs font-black">{formatCurrency(price)}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleAddToCart}
                disabled={addItem.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">কার্ট</span>
              </button>
              <Link
                href={`/checkout?productId=${product.id}&qty=${qty}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-black hover:bg-orange-600 active:scale-95 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                এখনই কিনুন
              </Link>
            </div>
          </div>
          {/* Safe area padding for iOS */}
          <div className="bg-gray-900/90 pb-safe" style={{ height: 'env(safe-area-inset-bottom)' }} />
        </div>
      )}
    </div>
  );
}

function RelatedProducts({ categorySlug, currentId }: { categorySlug: string; currentId: string }) {
  const { data } = useQuery({
    queryKey: ['related-products', categorySlug],
    queryFn: () => productsApi.getAll({ categorySlug, limit: 6 }),
  });
  const related = (data?.data ?? []).filter(p => p.id !== currentId);
  if (!related.length) return null;
  return (
    <div className="mt-12 border-t pt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">আপনার পছন্দ হতে পারে</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {related.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
