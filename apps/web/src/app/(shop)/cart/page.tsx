'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 font-serif text-2xl font-bold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground">Sign in to view your saved cart</p>
        <Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

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
        <h2 className="mb-2 font-serif text-2xl font-bold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground">Start shopping to add items to your cart</p>
        <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= 1000 ? 0 : 80;
  const total = subtotal + shipping;

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold">Shopping Cart ({cart.items.length} items)</h1>

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
                  <button onClick={() => removeItem.mutate(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1} className="hover:text-brand-600 disabled:opacity-30 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-[20px] text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      className="hover:text-brand-600 transition-colors">
                      <Plus className="h-3 w-3" />
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
          <h2 className="font-semibold text-lg">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">Add {formatCurrency(1000 - subtotal)} more for free shipping</p>
            )}
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-brand-600">{formatCurrency(total)}</span>
          </div>

          <Link href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>

          <Link href="/products" className="flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm hover:bg-accent transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
