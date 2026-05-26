'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { useGuestCart } from '@/store/guest-cart.store';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuthStore();
  const guestCart = useGuestCart();
  const { t } = useLanguage();

  // Guest cart view
  if (!isAuthenticated) {
    const items = guestCart.items;

    if (items.length === 0) {
      return (
        <div className="container py-20 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-serif text-2xl font-bold">{t.cart.emptyCart}</h2>
          <p className="mb-6 text-muted-foreground">{t.cart.startShopping}</p>
          <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {t.cart.browseProducts} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 1000 ? 0 : 80;
    const total = subtotal + shipping;

    return (
      <div className="container py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold">{t.cart.title} ({items.length} {t.cart.items})</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.productId} className="flex gap-4 rounded-xl border bg-card p-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/products/${item.slug}`} className="font-medium hover:text-brand-600 transition-colors line-clamp-2">
                      {item.name}
                    </Link>
                    <button onClick={() => guestCart.removeItem(item.productId)} className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive transition-colors touch-manipulation rounded-md flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md border">
                      <button
                        onClick={() => guestCart.updateQty(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-11 w-11 items-center justify-center hover:text-brand-600 disabled:opacity-30 transition-colors touch-manipulation"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[28px] text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => guestCart.updateQty(item.productId, item.quantity + 1)}
                        className="flex h-11 w-11 items-center justify-center hover:text-brand-600 transition-colors touch-manipulation"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-brand-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="h-fit rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-lg">{t.cart.orderSummary}</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.cart.subtotal}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.cart.shipping}</span>
                <span>{shipping === 0 ? <span className="text-green-600">{t.cart.free}</span> : formatCurrency(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">{t.cart.freeShippingMsg} {formatCurrency(1000 - subtotal)} {t.cart.freeShippingMsg2}</p>
              )}
            </div>

            <div className="border-t pt-4 flex justify-between font-semibold">
              <span>{t.cart.total}</span>
              <span className="text-brand-600">{formatCurrency(total)}</span>
            </div>

            <Link href="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              {t.cart.proceedCheckout} <ArrowRight className="h-4 w-4" />
            </Link>

            <Link href="/products" className="flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm hover:bg-accent transition-colors">
              {t.cart.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user cart view
  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 font-serif text-2xl font-bold">{t.cart.emptyCart}</h2>
        <p className="mb-6 text-muted-foreground">{t.cart.startShopping}</p>
        <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.cart.browseProducts} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= 1000 ? 0 : 80;
  const total = subtotal + shipping;

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold">{t.cart.title} ({cart.items.length} {t.cart.items})</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map(item => (
            <div key={item.id} className="flex gap-4 rounded-xl border bg-card p-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">📦</div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-brand-600 transition-colors line-clamp-2">
                      {item.product.name}
                    </Link>
                    {item.product.bookDetail && (
                      <p className="text-xs text-muted-foreground">by {item.product.bookDetail.author}</p>
                    )}
                  </div>
                  <button onClick={() => removeItem.mutate(item.id)} className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive transition-colors touch-manipulation rounded-md flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-md border">
                    <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1} className="flex h-11 w-11 items-center justify-center hover:text-brand-600 disabled:opacity-30 transition-colors touch-manipulation">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[28px] text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      className="flex h-11 w-11 items-center justify-center hover:text-brand-600 transition-colors touch-manipulation">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-semibold text-brand-600">{formatCurrency(Number(item.price) * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">{t.cart.orderSummary}</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.cart.subtotal}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.cart.shipping}</span>
              <span>{shipping === 0 ? <span className="text-green-600">{t.cart.free}</span> : formatCurrency(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">{t.cart.freeShippingMsg} {formatCurrency(1000 - subtotal)} {t.cart.freeShippingMsg2}</p>
            )}
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>{t.cart.total}</span>
            <span className="text-brand-600">{formatCurrency(total)}</span>
          </div>

          <Link href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {t.cart.proceedCheckout} <ArrowRight className="h-4 w-4" />
          </Link>

          <Link href="/products" className="flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm hover:bg-accent transition-colors">
            {t.cart.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}
