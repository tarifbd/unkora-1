import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestWishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useGuestWishlist = create<GuestWishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => set(s => ({
        productIds: s.productIds.includes(productId)
          ? s.productIds.filter(id => id !== productId)
          : [...s.productIds, productId]
      })),
      isWishlisted: (productId) => get().productIds.includes(productId),
    }),
    { name: 'unkora-guest-wishlist' }
  )
);
