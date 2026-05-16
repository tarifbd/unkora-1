'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useGuestCart } from '@/store/guest-cart.store';

export function useCart() {
  const { isAuthenticated } = useAuthStore();
  const { setCart, openCart } = useCartStore();
  const guestCart = useGuestCart();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then(c => { setCart(c); return c; }),
    enabled: isAuthenticated,
  });

  const addItem = useMutation({
    mutationFn: ({ productId, quantity, variantId, guestData }: { productId: string; quantity: number; variantId?: string; guestData?: { name: string; price: number; image?: string; slug: string } }) => {
      if (!isAuthenticated) {
        if (guestData) {
          guestCart.addItem({ productId, name: guestData.name, price: guestData.price, image: guestData.image, slug: guestData.slug, quantity });
        }
        return Promise.resolve(null as any);
      }
      return cartApi.addItem(productId, quantity, variantId);
    },
    onSuccess: (data) => {
      if (data) { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); }
      openCart();
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!isAuthenticated) {
        guestCart.updateQty(itemId, quantity);
        return Promise.resolve(null as any);
      }
      return cartApi.updateItem(itemId, quantity);
    },
    onSuccess: (data) => { if (data) { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); } },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => {
      if (!isAuthenticated) {
        guestCart.removeItem(itemId);
        return Promise.resolve(null as any);
      }
      return cartApi.removeItem(itemId);
    },
    onSuccess: (data) => { if (data) { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); } },
  });

  const guestItemCount = guestCart.items.reduce((s, i) => s + i.quantity, 0);

  return { cart, isLoading, addItem, updateItem, removeItem, guestCart, guestItemCount };
}
