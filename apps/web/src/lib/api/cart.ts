import api from '@/lib/api';
import type { Product } from './products';

export interface CartItem {
  id: string; cartId: string; productId: string; variantId?: string;
  quantity: number; price: string;
  product: Product;
}
export interface Cart {
  id: string; userId?: string; items: CartItem[];
  subtotal: number; itemCount: number;
}

export const cartApi = {
  get: () => api.get<{ data: Cart }>('/cart').then(r => r.data.data),

  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post<{ data: Cart }>('/cart/items', { productId, quantity, variantId }).then(r => r.data.data),

  updateItem: (itemId: string, quantity: number) =>
    api.patch<{ data: Cart }>(`/cart/items/${itemId}`, { quantity }).then(r => r.data.data),

  removeItem: (itemId: string) =>
    api.delete<{ data: Cart }>(`/cart/items/${itemId}`).then(r => r.data.data),

  clear: () => api.delete('/cart'),
};
