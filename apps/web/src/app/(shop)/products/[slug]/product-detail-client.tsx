'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Loader2, ArrowLeft, BookOpen, Package } from 'lucide-react';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';
import { ProductReviews } from '@/components/product/product-reviews';
import { WishlistButton } from '@/components/product/wishlist-button';
import { trackViewProduct, trackAddToCart } from '@/lib/analytics';

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
  });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const { openCart } = useCartStore();

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

  if (!product) return <div className="container py-12 text-center text-muted-foreground">Product not found</div>;

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
        <ArrowLeft className="h-4 w-4" /> Back to products
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
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><BookOpen className="h-4 w-4" /> Book Details</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Author', product.bookDetail.author],
                  ['Publisher', product.bookDetail.publisher],
                  ['Language', product.bookDetail.language],
                  ['Pages', product.bookDetail.pageCount],
                  ['Edition', product.bookDetail.edition],
                  ['ISBN', product.bookDetail.isbn],
                  ['Binding', product.bookDetail.binding],
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
              ? <span className="text-green-600 font-medium">In Stock ({product.stockQuantity} available)</span>
              : <span className="text-destructive font-medium">Out of Stock</span>}
          </div>

          {/* Qty + Add to Cart + Wishlist */}
          {product.stockQuantity > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="hover:text-brand-600 transition-colors"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-[24px] text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stockQuantity, qty + 1))} className="hover:text-brand-600 transition-colors"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={addItem.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {addItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  Add to Cart
                </button>
                <WishlistButton
                  productId={product.id}
                  className="h-10 w-10 rounded-md border hover:bg-accent transition-colors"
                />
              </div>
              <Link
                href={`/checkout?productId=${product.id}&qty=${qty}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary/90 transition-all"
              >
                ⚡ Buy Now
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
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
}
