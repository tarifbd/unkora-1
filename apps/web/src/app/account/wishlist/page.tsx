'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { wishlistApi } from '@/lib/api/wishlist';
import { formatCurrency } from '@/lib/utils';

function WishlistSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card overflow-hidden">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll(),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
      void qc.invalidateQueries({ queryKey: ['wishlist-check'] });
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold">My Wishlist</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <WishlistSkeleton key={i} />)}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Heart className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <h2 className="mb-1 font-semibold">Your wishlist is empty</h2>
          <p className="mb-4 text-sm text-muted-foreground">Save items you love to your wishlist</p>
          <Link
            href="/products"
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const product = item.product;
              const image = product.images?.[0]?.url;
              const price = product.salePrice ?? product.basePrice;
              const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);

              return (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  {/* Remove button */}
                  <button
                    onClick={() => removeMutation.mutate(product.id)}
                    disabled={removeMutation.isPending}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur-sm hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                    title="Remove from wishlist"
                  >
                    {removeMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                      )}
                      {product.stockQuantity === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium shadow">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      {product.bookDetail && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.bookDetail.author}</p>
                      )}
                      <h3 className="text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        <span className="font-semibold text-brand-600">{formatCurrency(Number(price))}</span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(Number(product.basePrice))}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
