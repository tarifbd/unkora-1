'use client';

import { Home, LayoutGrid, Search, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useGuestCart } from '@/store/guest-cart.store';
import { MobileTabBar, type TabItem } from './mobile-tab-bar';

/* Storefront bottom nav — the classic ecommerce app tab bar with a live cart badge. */
export function ShopBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const cart = useCartStore(s => s.cart);
  const guestItems = useGuestCart(s => s.items);

  const cartCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestItems.reduce((sum, i) => sum + i.quantity, 0);

  const primary: TabItem[] = [
    { href: '/',           icon: Home,         label: 'হোম',      exact: true },
    { href: '/categories', icon: LayoutGrid,   label: 'ক্যাটাগরি' },
    { href: '/search',     icon: Search,       label: 'সার্চ' },
    { href: '/cart',       icon: ShoppingCart, label: 'কার্ট', badge: cartCount },
    { href: '/account',    icon: User,         label: 'অ্যাকাউন্ট' },
  ];

  return <MobileTabBar primary={primary} />;
}
