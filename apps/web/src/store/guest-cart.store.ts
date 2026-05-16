import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  slug: string;
}

export interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: Omit<GuestCartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set(s => {
        const existing = s.items.find(i => i.productId === item.productId);
        if (existing) {
          return { items: s.items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i) };
        }
        return { items: [...s.items, { ...item, quantity: item.quantity ?? 1 }] };
      }),
      removeItem: (productId) => set(s => ({ items: s.items.filter(i => i.productId !== productId) })),
      updateQty: (productId, quantity) => set(s => ({
        items: quantity <= 0 ? s.items.filter(i => i.productId !== productId) : s.items.map(i => i.productId === productId ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'unkora-guest-cart' }
  )
);
