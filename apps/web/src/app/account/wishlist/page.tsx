'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Trash2, ShoppingCart, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { wishlistApi } from '@/lib/api/wishlist';
import { productsApi, type Product } from '@/lib/api/products';
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

  // Authenticated users: server wishlist
  const { data: serverItems, isLoading: serverLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll(),
    enabled: isAuthenticated,
  });

  // Guests: fetch the products they saved locally
  const { data: guestProducts, isLoading: guestLoading } = useQuery({
    queryKey: ['guest-wishlist-products', guestWishlist.productIds],
    queryFn: () => productsApi.getByIds(guestWishlist.productIds),
    enabled: !isAuthenticated && guestWishlist.productIds.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
      void qc.invalidateQueries({ queryKey: ['wishlist-check'] });
    },
  });

  const title = lang === 'en' ? 'My Wishlist' : 'আমার উইশলিস্ট';

  // Normalise both sources to a common product list
  const products: Product[] = isAuthenticated
    ? (serverItems?.map(i => i.product) ?? [])
    : (guestProducts ?? []);

  const isLoading = isAuthenticated ? serverLoading : guestLoading;

  const removeItem = (productId: string) => {
    if (isAuthenticated) {
      removeMutation.mutate(productId);
    } else {
      guestWishlist.toggle(productId);
      void qc.invalidateQueries({ queryKey: ['guest-wishlist-products'] });
    }
  };

  // Empty state — for guests with nothing saved we also nudge them to sign in
  const isEmpty = !isLoading && products.length === 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">{title}</h1>
        {!isAuthenticated && products.length > 0 && (
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold hover:bg-accent transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            {lang === 'en' ? 'Sign in to sync' : 'সিঙ্ক করতে সাইন ইন'}
          </Link>
        )}
      </div>

      {/* Guest banner — items still show, this is just a hint */}
      {!isAuthenticated && products.length > 0 && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-700">
          {lang === 'en'
            ? 'These items are saved on this device. Sign in to keep them on your account and access from anywhere.'
            : 'এই পণ্যগুলো এই ডিভাইসে সেভ করা আছে। অ্যাকাউন্টে রাখতে এবং যেকোনো জায়গা থেকে দেখতে সাইন ইন করুন।'}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <WishlistSkeleton key={i} />)}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center gap-4">
          <Heart className="h-14 w-14 text-red-300" />
          <div>
            <h2 className="font-bold text-lg mb-1">
              {lang === 'en' ? 'Your wishlist is empty' : 'উইশলিস্ট খালি'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === 'en'
                ? 'Tap the heart icon on any product to save it here.'
                : 'যেকোনো পণ্যের হার্ট আইকনে ক্লিক করে এখানে সেভ করুন।'}
            </p>
            {!isAuthenticated && (
              <p className="mt-2 text-xs text-muted-foreground">
                {lang === 'en'
                  ? 'Sign in to sync your wishlist across devices.'
                  : 'ডিভাইস জুড়ে উইশলিস্ট সিঙ্ক করতে সাইন ইন করুন।'}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:from-slate-600 hover:to-slate-800 transition-all"
            >
              {lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন'}
            </Link>
            {!isAuthenticated && (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-bold hover:bg-accent transition-colors"
              >
                <LogIn className="h-4 w-4" />
                {lang === 'en' ? 'Sign In' : 'সাইন ইন'}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {lang === 'en'
              ? `${products.length} item${products.length !== 1 ? 's' : ''} saved`
              : `${products.length}টি পণ্য সেভ করা আছে`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => {
              const image = product.images?.[0]?.url;
              const price = product.salePrice ?? product.basePrice;
              const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
              const inStock = product.stockQuantity > 0;
              const removing = isAuthenticated && removeMutation.isPending && removeMutation.variables === product.id;

              return (
                <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(product.id)}
                    disabled={removing}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur-sm hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                    title={lang === 'en' ? 'Remove from wishlist' : 'উইশলিস্ট থেকে সরান'}
                  >
                    {removing ? (
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
