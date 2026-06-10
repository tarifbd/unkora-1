'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useLanguage } from '@/lib/i18n/language-context';
import { WishlistButton } from './wishlist-button';
import { PreorderButton, PreorderTag } from './preorder-button';
import { isPreorderProduct } from '@/lib/preorder';
import { trackAddToCart } from '@/lib/analytics';

interface ProductCardProps {
  product: Product;
  className?: string;
  listView?: boolean;
  mini?: boolean;
}

export function ProductCard({ product, className, listView, mini }: ProductCardProps) {
  const { addItem } = useCart();
  const { lang } = useLanguage();

  const image = product.images?.[0]?.url;
  const isUnsplash = image?.includes('unsplash.com') ?? false;
  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
  const price = Number(product.salePrice ?? product.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)
    : 0;
  const reviewCount = product._count?.reviews ?? 0;
  const inStock = product.stockQuantity > 0;
  const preorder = isPreorderProduct(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem.mutate({ productId: product.id, quantity: 1, guestData: { name: product.name, price, image, slug: product.slug } });
    trackAddToCart({ productId: product.id, name: product.name, price });
  };

  /* ── LIST VIEW ─────────────────────────────────────────── */
  if (listView) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          'bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex gap-3 p-3',
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
          {image ? (
            <Image src={image} alt={product.name} fill unoptimized={isUnsplash} className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gray-200">📚</div>
          )}
          {hasDiscount && !preorder && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
              -{discountPct}%
            </span>
          )}
          {preorder && (
            <PreorderTag lang={lang} className="absolute top-1 left-1 !text-[8px] !px-1.5 !py-0.5" />
          )}
          <div className="absolute top-1 right-1">
            <WishlistButton
              productId={product.id}
              className="p-1 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-red-50 transition-colors"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5">
          <div>
            {product.category && (
              <span className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">{product.category.name}</span>
            )}
            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-5 mt-0.5">
              {product.name}
            </h3>
            {product.bookDetail?.author && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.bookDetail.author}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-primary">৳{price.toLocaleString('en-BD')}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString('en-BD')}</span>
              )}
            </div>
            {preorder ? (
              <PreorderButton productSlug={product.slug} lang={lang} className="!h-8 px-3 flex-shrink-0" />
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addItem.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-b from-slate-700 to-slate-900 text-white rounded-lg text-xs font-bold shadow-md shadow-slate-900/30 hover:from-slate-600 hover:to-slate-800 active:scale-95 transition-all flex-shrink-0 ring-1 ring-white/10"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'কার্টে যোগ' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* ── GRID VIEW ─────────────────────────────────────────── */
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 overflow-hidden',
        'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        'group relative flex flex-col h-full',
        className
      )}
    >
      {/* ── Image (fixed ratio) ── */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden flex-shrink-0">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized={isUnsplash}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 240px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-200 bg-gray-50">📚</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {preorder && <PreorderTag lang={lang} />}
          {hasDiscount && !preorder && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.isFeatured && !hasDiscount && !preorder && (
            <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
              {lang === 'bn' ? 'জনপ্রিয়' : 'Hot'}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-2 right-2">
          <WishlistButton
            productId={product.id}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition-colors"
          />
        </div>

        {/* Out of stock overlay — only when NOT available for pre-order */}
        {!inStock && !preorder && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-gray-800 text-white px-4 py-1.5 text-xs font-bold shadow-lg">
              {lang === 'bn' ? 'স্টক নেই' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        {/* Category */}
        {product.category && (
          <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">
            {product.category.name}
          </span>
        )}

        {/* Title — grows to fill available space */}
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug flex-1 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Author */}
        {product.bookDetail?.author && (
          <p className="text-[10px] text-gray-400 truncate">{product.bookDetail.author}</p>
        )}

        {/* Stars — always visible */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={cn('w-3 h-3', reviewCount > 0 && i < 4 ? 'text-yellow-400' : 'text-gray-200')} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[9px] text-gray-400">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-base font-black text-primary">৳{price.toLocaleString('en-BD')}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString('en-BD')}</span>
          )}
        </div>

        {/* ── Buttons ── always pinned at bottom */}
        {preorder ? (
          <div className="mt-auto pt-2">
            <PreorderButton productSlug={product.slug} lang={lang} full />
          </div>
        ) : mini ? (
          /* Full buttons for related/recommended product cards */
          <div className="mt-auto pt-2 grid grid-cols-2 gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={addItem.isPending}
              className="flex items-center justify-center gap-1 h-9 rounded-xl text-[11px] font-black transition-all bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-md shadow-slate-900/40 hover:from-slate-600 hover:to-slate-800 active:scale-95 ring-1 ring-white/10"
            >
              <ShoppingCart className="w-3 h-3 flex-shrink-0" />
              <span>{lang === 'bn' ? 'কার্টে' : 'Cart'}</span>
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/checkout?productSlug=${product.slug}&qty=1`; }}
              className="flex items-center justify-center gap-1 h-9 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-xl text-[11px] font-black shadow-md shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-95 transition-all ring-1 ring-white/20"
            >
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span>{lang === 'bn' ? 'কিনুন' : 'Buy'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={addItem.isPending}
              className="flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-black transition-all bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/40 hover:from-slate-600 hover:to-slate-800 active:scale-95 ring-1 ring-white/10"
            >
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'কার্টে যোগ করুন' : 'ADD TO CART'}</span>
              <span className="sm:hidden">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
            </button>

            {/* Buy Now */}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/checkout?productSlug=${product.slug}&qty=1`; }}
              className="flex items-center justify-center gap-1 h-9 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-95 transition-all ring-1 ring-white/20"
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'এখনই কিনুন' : 'BUY NOW'}</span>
              <span className="sm:hidden">{lang === 'bn' ? 'কিনুন' : 'Buy'}</span>
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
