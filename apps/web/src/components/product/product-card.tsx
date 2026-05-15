'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useLanguage } from '@/lib/i18n/language-context';
import { useRouter } from 'next/navigation';
import { WishlistButton } from './wishlist-button';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuthStore();
  const { openCart } = useCartStore();
  const router = useRouter();
  const { t } = useLanguage();

  const image = product.images?.[0]?.url;
  const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
  const price = Number(product.salePrice ?? product.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/login'); return; }
    addItem.mutate({ productId: product.id, quantity: 1 });
    openCart();
  };

  const reviewCount = product._count?.reviews ?? 0;
  const rating = reviewCount > 0 ? Math.min(5, 3.5 + (reviewCount % 10) * 0.15) : 4.0;
  const fullStars = Math.floor(rating);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'bg-white rounded-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full',
        className,
      )}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
          {discountPct}{t.product.off}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="240px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-200 bg-gray-50">📦</div>
        )}

        {/* Out of stock */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium shadow text-gray-600">{t.product.outOfStock}</span>
          </div>
        )}

        {/* Hover overlay with wishlist */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <WishlistButton
            productId={product.id}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-grow">
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-primary transition-colors h-10 leading-5">
          {product.name}
        </h3>
        {product.bookDetail && (
          <p className="text-xs text-gray-500 mb-2 truncate">{product.bookDetail.author}</p>
        )}

        {/* Stars */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn('w-3 h-3', i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
            />
          ))}
          {reviewCount > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">({reviewCount})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-primary italic">TK. {price.toLocaleString('en-BD')}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">TK. {Number(product.basePrice).toLocaleString('en-BD')}</span>
          )}
        </div>
      </div>

      {/* Add to Cart */}
      {product.stockQuantity > 0 && (
        <button
          onClick={handleAddToCart}
          disabled={addItem.isPending}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group/btn disabled:opacity-50"
        >
          <ShoppingCart className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          <span>{t.product.addToCart}</span>
        </button>
      )}
    </Link>
  );
}
