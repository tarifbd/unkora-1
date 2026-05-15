'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
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

  const image = product.images?.[0]?.url;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const price = product.salePrice ?? product.basePrice;
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

  // Fake rating based on review count for display purposes
  const reviewCount = product._count?.reviews ?? 0;
  const rating = reviewCount > 0 ? Math.min(5, 3.5 + (reviewCount % 10) * 0.15) : 4.0;
  const fullStars = Math.floor(rating);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">📦</div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-white z-10">
            -{discountPct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium shadow text-gray-600">Out of Stock</span>
          </div>
        )}

        {/* Hover overlay with wishlist */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-start justify-end p-2">
          <WishlistButton
            productId={product.id}
            className="h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        {product.bookDetail && (
          <p className="text-[10px] text-gray-400 line-clamp-1">{product.bookDetail.author}</p>
        )}

        <h3 className="text-xs font-semibold line-clamp-2 leading-snug text-gray-800 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-2.5 w-2.5',
                i < fullStars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
              )}
            />
          ))}
          {reviewCount > 0 && (
            <span className="text-[9px] text-gray-400 ml-0.5">({reviewCount})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-primary italic">{formatCurrency(Number(price))}</span>
          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through">{formatCurrency(Number(product.basePrice))}</span>
          )}
        </div>

        {/* Add to Cart */}
        {product.stockQuantity > 0 && (
          <button
            onClick={handleAddToCart}
            disabled={addItem.isPending}
            className="mt-1.5 flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3" />
            Add to Cart
          </button>
        )}
      </div>
    </Link>
  );
}
