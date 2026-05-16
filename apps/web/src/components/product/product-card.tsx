'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useLanguage } from '@/lib/i18n/language-context';
import { WishlistButton } from './wishlist-button';
import { trackAddToCart } from '@/lib/analytics';

interface ProductCardProps {
  product: Product;
  className?: string;
  listView?: boolean;
}

export function ProductCard({ product, className, listView }: ProductCardProps) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();

  const image = product.images?.[0]?.url;
  const isUnsplash = image?.includes('unsplash.com') ?? false;
  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
  const price = Number(product.salePrice ?? product.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem.mutate({
      productId: product.id,
      quantity: 1,
      guestData: {
        name: product.name,
        price: price,
        image: image,
        slug: product.slug,
      },
    });
    trackAddToCart({ productId: product.id, name: product.name, price });
  };

  const reviewCount = product._count?.reviews ?? 0;
  const fullStars = reviewCount > 0 ? 4 : 0; // Only show stars when reviews exist

  if (listView) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          'bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex gap-4 p-3',
          className,
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
          {image ? (
            <Image src={image} alt={product.name} fill unoptimized={isUnsplash} className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gray-200">📚</div>
          )}
          {hasDiscount && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <div>
            {product.category && (
              <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">{product.category.name}</span>
            )}
            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-5 mt-0.5">
              {product.name}
            </h3>
            {product.bookDetail?.author && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{product.bookDetail.author}</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-primary">৳{price.toLocaleString('en-BD')}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString('en-BD')}</span>
              )}
            </div>
            {product.stockQuantity > 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={addItem.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-xs font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50 flex-shrink-0"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {t.product.addToCart}
              </button>
            ) : (
              <span className="text-xs text-gray-400 font-medium">{t.product.outOfStock}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative flex flex-col',
        className,
      )}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {hasDiscount && (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
            -{discountPct}%
          </span>
        )}
        {product.isFeatured && !hasDiscount && (
          <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
            {lang === 'bn' ? 'জনপ্রিয়' : 'Hot'}
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized={isUnsplash}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-200 bg-gray-50">📚</div>
        )}

        {/* Out of stock overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-gray-800 text-white px-4 py-1.5 text-xs font-bold shadow-lg">
              {t.product.outOfStock}
            </span>
          </div>
        )}

        {/* Hover action buttons */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <WishlistButton
            productId={product.id}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors"
          />
          <Link
            href={`/products/${product.slug}`}
            onClick={e => e.stopPropagation()}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Category tag */}
        {product.category && (
          <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-1">
            {product.category.name}
          </span>
        )}

        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-5 flex-grow">
          {product.name}
        </h3>

        {product.bookDetail?.author && (
          <p className="text-xs text-gray-400 mb-2 truncate">{product.bookDetail.author}</p>
        )}

        {/* Stars */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={cn('w-3 h-3', i < fullStars ? 'text-yellow-400' : 'text-gray-200')} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-gray-400">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-black text-primary">৳{price.toLocaleString('en-BD')}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString('en-BD')}</span>
          )}
        </div>

        {/* Add to Cart */}
        {product.stockQuantity > 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={addItem.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.product.addToCart}</span>
          </button>
        ) : (
          <button disabled className="w-full py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
            {t.product.outOfStock}
          </button>
        )}
        {product.stockQuantity > 0 && (
          <Link
            href={`/checkout?productId=${product.id}&qty=1`}
            onClick={e => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all mt-1.5"
          >
            ⚡ {lang === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}
          </Link>
        )}
      </div>
    </Link>
  );
}
