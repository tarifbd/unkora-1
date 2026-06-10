'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Trash2, ShoppingCart, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { wishlistApi } from '@/lib/api/wishlist';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useGuestWishlist } from '@/store/guest-wishlist.store';
import { useCart } from '@/lib/hooks/use-cart';
import { useLanguage } from '@/lib/i18n/language-context';

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
  const { isAuthenticated } = useAuthStore();
  const guestWishlist = useGuestWishlist();
  const { addItem } = useCart();
  const { lang } = useLanguage();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll(),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
      void qc.invalidateQueries({ queryKey: ['wishlist-check'] });
    },
  });

  const title = lang === 'en' ? 'My Wishlist' : 'আমার উইশলিস্ট';

  if (!isAuthenticated) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-2xl font-bold">{title}</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center gap-4">
          <Heart className="h-14 w-14 text-red-300" />
          <div>
            <h2 className="font-bold text-lg mb-1">
              {lang === 'en' ? 'Sign in to see your wishlist' : 'উইশলিস্ট দেখতে সাইন ইন করুন'}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              {lang === 'en'
                ? 'Save items you love and access them from any device.'
                : 'পছন্দের পণ্য সেভ করুন এবং যেকোনো ডিভাইস থেকে দেখুন।'}
            </p>
            {guestWishlist.productIds.length > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                {lang === 'en'
                  ? `You have ${guestWishlist.productIds.length} item(s) saved locally — sign in to sync them.`
                  : `আপনার ${guestWishlist.productIds.length}টি পণ্য লোকালি সেভ করা আছে — সিঙ্ক করতে সাইন ইন করুন।`}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:from-slate-600 hover:to-slate-800 transition-all"
            >
              <LogIn className="h-4 w-4" />
              {lang === 'en' ? 'Sign In' : 'সাইন ইন'}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-bold hover:bg-accent transition-colors"
            >
              {lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold">{title}</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <WishlistSkeleton key={i} />)}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Heart className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <h2 className="mb-1 font-semibold">
            {lang === 'en' ? 'Your wishlist is empty' : 'উইশলিস্ট খালি'}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {lang === 'en' ? 'Save items you love to your wishlist' : 'পছন্দের পণ্যে হার্ট আইকনে ক্লিক করুন'}
          </p>
          <Link
            href="/products"
            className="rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:from-slate-600 hover:to-slate-800 transition-all"
          >
            {lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন'}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {lang === 'en'
              ? `${items.length} item${items.length !== 1 ? 's' : ''} saved`
              : `${items.length}টি পণ্য সেভ করা আছে`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(item => {
              const product = item.product;
              const image = product.images?.[0]?.url;
              const price = product.salePrice ?? product.basePrice;
              const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
              const inStock = product.stockQuantity > 0;

              return (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  {/* Remove button */}
                  <button
                    onClick={() => removeMutation.mutate(product.id)}
                    disabled={removeMutation.isPending}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur-sm hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                    title={lang === 'en' ? 'Remove from wishlist' : 'উইশলিস্ট থেকে সরান'}
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
                      {!inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium shadow">
                            {lang === 'en' ? 'Out of Stock' : 'স্টক নেই'}
                          </span>
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

                  {/* Add to cart */}
                  {inStock && (
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => addItem.mutate({ productId: product.id, quantity: 1, guestData: { name: product.name, price: Number(price), image, slug: product.slug } })}
                        disabled={addItem.isPending}
                        className="w-full flex items-center justify-center gap-1.5 h-9 bg-gradient-to-b from-slate-700 to-slate-900 text-white rounded-xl text-xs font-black shadow-md shadow-slate-900/30 hover:from-slate-600 hover:to-slate-800 active:scale-95 transition-all ring-1 ring-white/10 disabled:opacity-50"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {lang === 'en' ? 'Add to Cart' : 'কার্টে যোগ করুন'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
