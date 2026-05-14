import api from '@/lib/api';
import type { Product } from './products';

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export const wishlistApi = {
  getAll: () =>
    api.get<{ data: WishlistItem[] }>('/wishlist').then(r => r.data.data),

  toggle: (productId: string) =>
    api.post<{ data: { wishlisted: boolean } }>('/wishlist/toggle', { productId }).then(r => r.data.data),

  check: (productId: string) =>
    api.get<{ data: { wishlisted: boolean } }>(`/wishlist/check/${productId}`).then(r => r.data.data),
};
