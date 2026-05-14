'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

export function useCart() {
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then(c => { setCart(c); return c; }),
    enabled: isAuthenticated,
  });

  const addItem = useMutation({
    mutationFn: ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) =>
      cartApi.addItem(productId, quantity, variantId),
    onSuccess: (data) => { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); },
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: (data) => { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: (data) => { setCart(data); void qc.invalidateQueries({ queryKey: ['cart'] }); },
  });

  return { cart, isLoading, addItem, updateItem, removeItem };
}
