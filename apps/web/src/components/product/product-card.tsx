'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
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
    if (!isAuthenticated) { router.push('/login'); return; }
    addItem.mutate({ productId: product.id, quantity: 1 });
    openCart();
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn('group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md', className)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {image ? (
          <Image src={image} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-white">
            -{discountPct}%
          </span>
        )}
        <WishlistButton
          productId={product.id}
          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-background/80 shadow backdrop-blur-sm hover:bg-background transition-colors"
        />
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium shadow">Out of Stock</span>
          </div>
        )}
        {/* Quick add */}
        {product.stockQuantity > 0 && (
          <button
            onClick={handleAddToCart}
            disabled={addItem.isPending}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/90 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.bookDetail && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.bookDetail.author}</p>
        )}
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
        {product._count && product._count.reviews > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
            <span className="text-xs text-muted-foreground">({product._count.reviews})</span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="font-semibold text-brand-600">{formatCurrency(Number(price))}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(Number(product.basePrice))}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
