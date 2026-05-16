'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useGuestCart } from '@/store/guest-cart.store';
import { useCart } from '@/lib/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';

export function CartDrawer() {
  const { isOpen, closeCart, cart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const guestCart = useGuestCart();
  const { removeItem, updateItem } = useCart();

  if (!isOpen) return null;

  // Compute item count for header
  const itemCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestCart.items.reduce((s, i) => s + i.quantity, 0);

  // Compute subtotal for guest
  const guestSubtotal = guestCart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Determine whether cart has items
  const hasItems = isAuthenticated
    ? !!(cart && cart.items.length > 0)
    : guestCart.items.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeCart} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h2 className="font-semibold">Cart ({itemCount})</h2>
          <button onClick={closeCart} className="rounded-md p-1 hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          ) : isAuthenticated ? (
            <ul className="space-y-4">
              {cart!.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium line-clamp-2 hover:text-brand-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm font-semibold text-brand-600">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        className="flex h-6 w-6 items-center justify-center rounded border hover:bg-accent transition-colors"
                        disabled={updateItem.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        className="flex h-6 w-6 items-center justify-center rounded border hover:bg-accent transition-colors"
                        disabled={updateItem.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                        disabled={removeItem.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-4">
              {guestCart.items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium line-clamp-2 hover:text-brand-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm font-semibold text-brand-600">
                      {formatCurrency(item.price * item.quantity)}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => guestCart.updateQty(item.productId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border hover:bg-accent transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => guestCart.updateQty(item.productId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border hover:bg-accent transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => guestCart.removeItem(item.productId)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {hasItems && (
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">
                {formatCurrency(isAuthenticated ? cart!.subtotal : guestSubtotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Checkout — {formatCurrency(isAuthenticated ? cart!.subtotal : guestSubtotal)}
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-md border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
