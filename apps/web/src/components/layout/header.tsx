'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book, Baby, Briefcase, Leaf, Palette, Zap, ShoppingBag,
  Menu, X, Search, User, ShoppingCart, ChevronDown,
  MapPin, Phone,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/lib/hooks/use-auth';
import type { LucideIcon } from 'lucide-react';

interface NavCategory {
  name: string;
  icon: LucideIcon;
  slug: string;
  subnav: string[];
}

const NAV_CATEGORIES: NavCategory[] = [
  { name: 'Books', icon: Book, slug: '/books', subnav: ['Authors', 'Subjects', 'Publishers', 'Boi Mela 2026', 'Academic Books', 'Islamic Books'] },
  { name: 'Baby Products', icon: Baby, slug: '/categories/baby-products', subnav: ['Diapering & Care', 'Feeding & Nursing', 'Baby Gear', 'Toys & Games'] },
  { name: 'Leather Products', icon: Briefcase, slug: '/categories/leather-products', subnav: ['Wallets & Cards', 'Bags & Backpacks', 'Belts & Accessories'] },
  { name: 'Organic Foods', icon: Leaf, slug: '/categories/organic-foods', subnav: ['Nuts & Seeds', 'Honey & Sweeteners', 'Spices & Herbs'] },
  { name: 'Handicrafts & Decor', icon: Palette, slug: '/categories/handicrafts', subnav: ['Wall Art', 'Showpieces', 'Lamps & Lighting'] },
  { name: 'Electronics', icon: Zap, slug: '/categories/electronics', subnav: ['Mobiles', 'Laptops', 'Accessories'] },
  { name: 'Daily Needs', icon: ShoppingBag, slug: '/categories/daily-needs', subnav: ['Grocery', 'Personal Care', 'Household'] },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = cart?.itemCount ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeCategory = NAV_CATEGORIES[activeCategoryIndex];

  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-sm">
        {/* Tier 1 — Black utility bar (desktop only) */}
        <div className="hidden md:block bg-gray-900 text-gray-300 text-xs">
          <div className="container flex items-center justify-between h-8 gap-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                <MapPin className="h-3 w-3 text-[#f59e0b]" />
                <span>Deliver to <span className="text-white font-medium">Select your address</span></span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-[#f59e0b]" />
                <span>16297 <span className="text-gray-400">(9 AM - 8 PM)</span></span>
              </div>
              <div className="flex items-center gap-1 border border-gray-600 rounded overflow-hidden text-[10px]">
                <button className="px-2 py-0.5 bg-[#047857] text-white font-medium">EN</button>
                <button className="px-2 py-0.5 hover:text-white transition-colors">BN</button>
              </div>
            </div>
            {/* Right */}
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-white transition-colors">App</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
              <Link href="#" className="hover:text-white transition-colors">Track Order</Link>
              <Link href="#" className="hover:text-white transition-colors bg-[#f59e0b] text-gray-900 font-medium px-2 py-0.5 rounded">
                Sell on Unkora
              </Link>
            </div>
          </div>
        </div>

        {/* Tier 2 — Main bar */}
        <div className="bg-[#047857]">
          <div className="container flex items-center gap-3 h-16">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex items-center justify-center h-9 w-9 text-white hover:bg-white/10 rounded transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 mr-2">
              <span className="font-bold text-2xl text-white tracking-tight leading-none">UNKORA</span>
              <span className="font-bold text-2xl text-[#f59e0b] tracking-tight leading-none">.SHOP</span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto">
              <div className="flex w-full rounded overflow-hidden border-2 border-[#f59e0b]">
                <select className="h-10 px-3 text-sm bg-gray-100 border-r border-gray-300 text-gray-700 focus:outline-none cursor-pointer shrink-0">
                  <option value="">All</option>
                  {NAV_CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, books, categories..."
                  className="flex-1 h-10 px-4 text-sm bg-white text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#f59e0b] hover:bg-amber-600 text-white font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Search className="h-4 w-4" />
                  <span className="text-sm hidden lg:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto md:ml-0">
              {/* Auth */}
              <div className="hidden md:flex flex-col items-start">
                <span className="text-white/70 text-[10px] leading-none">Hello,</span>
                {isAuthenticated ? (
                  <Link href="/account" className="text-white text-sm font-semibold leading-none mt-0.5 hover:text-[#f59e0b] transition-colors line-clamp-1 max-w-[100px]">
                    {user?.firstName ?? user?.name ?? 'Account'}
                  </Link>
                ) : (
                  <Link href="/login" className="text-white text-sm font-semibold leading-none mt-0.5 hover:text-[#f59e0b] transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
              {isAuthenticated && user?.role !== 'CUSTOMER' && (
                <Link href="/admin" className="hidden md:inline text-white/80 text-xs hover:text-[#f59e0b] border border-white/30 rounded px-2 py-1 transition-colors">Admin</Link>
              )}
              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative flex items-center gap-2 text-white hover:text-[#f59e0b] transition-colors px-2 py-1"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-bold text-gray-900">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-white/70 text-[10px] leading-none">My</span>
                  <span className="text-sm font-semibold leading-none mt-0.5">Cart</span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden px-3 pb-3">
            <form onSubmit={handleSearch} className="flex rounded overflow-hidden border-2 border-[#f59e0b]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 h-9 px-3 text-sm bg-white text-gray-900 focus:outline-none"
              />
              <button type="submit" className="h-9 px-4 bg-[#f59e0b] text-white flex items-center">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Tier 3 — Desktop category nav */}
        <div className="hidden md:block bg-gray-800 text-white">
          <div className="container flex items-center h-10 gap-0">
            <button className="flex items-center gap-2 bg-gray-900 hover:bg-black h-10 px-4 text-sm font-semibold shrink-0 transition-colors">
              <Menu className="h-4 w-4" />
              All Departments
              <ChevronDown className="h-3 w-3" />
            </button>

            <nav className="flex items-center flex-1 overflow-x-auto hide-scrollbar">
              {NAV_CATEGORIES.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.slug}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-10 text-sm whitespace-nowrap transition-colors relative shrink-0',
                    activeCategoryIndex === idx
                      ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#f59e0b]'
                      : 'text-gray-300 hover:text-white',
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5 shrink-0" />
                  {cat.name}
                </Link>
              ))}
            </nav>

            <Link
              href="#"
              className="shrink-0 px-4 h-10 flex items-center text-sm font-semibold text-[#f59e0b] hover:text-amber-400 transition-colors"
            >
              Deal of the Day 🔥
            </Link>
          </div>
        </div>

        {/* Tier 4 — Desktop subnav */}
        {activeCategory && (
          <div
            className="hidden md:block bg-[#ecfdf5] border-b border-gray-200"
            onMouseLeave={() => setActiveCategoryIndex(activeCategoryIndex)}
          >
            <div className="container flex items-center gap-1 h-9 overflow-x-auto hide-scrollbar">
              <span className="text-xs text-gray-500 font-medium shrink-0 mr-2">{activeCategory.name}:</span>
              {activeCategory.subnav.map(sub => (
                <Link
                  key={sub}
                  href={`${activeCategory.slug}?tag=${encodeURIComponent(sub)}`}
                  className="text-xs text-gray-600 hover:text-[#047857] hover:bg-white px-3 py-1 rounded-full border border-transparent hover:border-[#047857]/20 whitespace-nowrap transition-all shrink-0"
                >
                  {sub}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 md:hidden flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="bg-[#047857] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-bold text-xl text-white">UNKORA</span>
            <span className="font-bold text-xl text-[#f59e0b]">.SHOP</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User section */}
        <div className="bg-[#ecfdf5] px-4 py-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#047857] flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          {isAuthenticated ? (
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.firstName ?? user?.name}</p>
              <Link href="/account" onClick={() => setSidebarOpen(false)} className="text-xs text-[#047857] hover:underline">View Profile</Link>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-700">Hello, Guest</p>
              <Link href="/login" onClick={() => setSidebarOpen(false)} className="text-xs text-[#047857] font-medium hover:underline">Sign in</Link>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Categories</p>
          {NAV_CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={cat.slug}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 hover:bg-[#ecfdf5] transition-colors',
                pathname.startsWith(cat.slug) ? 'text-[#047857] bg-[#ecfdf5]' : 'text-gray-700',
              )}
            >
              <cat.icon className="h-4 w-4 text-[#047857] shrink-0" />
              <span>{cat.name}</span>
            </Link>
          ))}

          <div className="border-t mt-2 pt-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Help & Settings</p>
            {isAuthenticated ? (
              <>
                <Link href="/account" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <User className="h-4 w-4 text-gray-400" />
                  My Account
                </Link>
                {user?.role !== 'CUSTOMER' && (
                  <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { void logout.mutate(); setSidebarOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 border-b border-gray-100 w-full text-left transition-colors"
                >
                  <X className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <User className="h-4 w-4 text-gray-400" />
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <User className="h-4 w-4 text-gray-400" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
