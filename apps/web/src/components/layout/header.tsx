'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book, Baby, Briefcase, Leaf, Palette, Zap, ShoppingBag,
  Menu, X, Search, User, ShoppingCart, ChevronDown,
  MapPin, Phone, Download, HelpCircle,
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
  { name: 'Books',            icon: Book,        slug: '/books',                       subnav: ['Authors', 'Subjects', 'Publishers', 'Boi Mela 2026', 'Academic Books', 'E-Books', 'Islamic Books'] },
  { name: 'Baby Products',    icon: Baby,        slug: '/categories/baby-products',    subnav: ['Diapering & Care', 'Feeding & Nursing', 'Baby Gear', 'Toys & Games', 'Baby Clothing'] },
  { name: 'Leather Products', icon: Briefcase,   slug: '/categories/leather-products', subnav: ['Wallets & Cards', 'Bags & Backpacks', 'Belts & Accessories', "Men's Footwear", "Women's Footwear"] },
  { name: 'Organic Foods',    icon: Leaf,        slug: '/categories/organic-foods',    subnav: ['Nuts & Seeds', 'Honey & Sweeteners', 'Spices & Herbs', 'Healthy Snacks', 'Tea & Beverages'] },
  { name: 'Handicrafts',      icon: Palette,     slug: '/categories/handicrafts',      subnav: ['Wall Art', 'Showpieces', 'Lamps & Lighting', 'Rugs & Carpets', 'Traditional Crafts'] },
  { name: 'Electronics',      icon: Zap,         slug: '/categories/electronics',      subnav: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances', 'Gadgets'] },
  { name: 'Daily Needs',      icon: ShoppingBag, slug: '/categories/daily-needs',      subnav: ['Grocery', 'Personal Care', 'Household', 'Stationery', 'Pet Care'] },
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
      <header className="sticky top-0 z-50 w-full shadow-sm border-b border-gray-200 bg-white">

        {/* ── Tier 1: Utility bar ── */}
        <div className="bg-[#1a1a1a] py-1.5 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[11px] text-gray-300 font-medium">
            {/* Left */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                <MapPin className="w-3 h-3 text-primary" />
                Deliver to <span className="font-bold text-white ml-0.5">Select your address</span>
              </span>
              <div className="h-3 w-px bg-gray-600" />
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary" />
                <span>16297 (9 AM - 8 PM)</span>
              </div>
              <div className="h-3 w-px bg-gray-600" />
              <div className="flex items-center bg-gray-800 rounded-full px-1 py-0.5 border border-gray-700">
                <button className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-sm">ENG</button>
                <button className="px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-400 hover:text-white transition-colors">বাংলা</button>
              </div>
            </div>
            {/* Right */}
            <div className="flex items-center gap-5 uppercase tracking-wide">
              <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> App
              </a>
              <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Support
              </a>
              <a href="#" className="hover:text-primary transition-colors">Track Order</a>
              <a href="#" className="hover:text-primary transition-colors font-bold text-white">Sell on Unkora</a>
            </div>
          </div>
        </div>

        {/* ── Tier 2: Main bar ── */}
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 relative z-40 bg-white">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-8">

            {/* Mobile toggle + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-800 hover:text-secondary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight flex items-center">
                <span className="text-gray-900">UNKORA</span>
                <span className="text-secondary">.SHOP</span>
              </Link>
            </div>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-grow max-w-3xl relative"
            >
              <div className="flex w-full rounded-lg overflow-hidden border-2 border-gray-200 focus-within:border-primary focus-within:shadow-md transition-all duration-300">
                <select className="bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 border-r border-gray-200 cursor-pointer hover:bg-gray-200 focus:outline-none">
                  <option value="">All</option>
                  {NAV_CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search 1M+ products..."
                  className="w-full px-4 py-2.5 outline-none text-[15px] placeholder:text-gray-400 text-black border-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/80 text-white px-8 transition-colors flex items-center justify-center font-bold"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-5 md:gap-6 lg:gap-8 flex-shrink-0 text-gray-800">
              {/* Account */}
              <div className="flex items-center gap-2 cursor-pointer group hover:text-secondary transition-colors">
                <div className="p-2">
                  <User className="w-[26px] h-[26px]" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">
                    {isAuthenticated ? `Hello, ${user?.firstName ?? user?.name ?? ''}` : 'Hello, Sign In'}
                  </p>
                  {isAuthenticated ? (
                    <Link href="/account" className="text-sm font-bold leading-tight flex items-center hover:text-secondary transition-colors">
                      Account &amp; Orders <ChevronDown className="w-3 h-3 ml-0.5" />
                    </Link>
                  ) : (
                    <Link href="/login" className="text-sm font-bold leading-tight flex items-center hover:text-secondary transition-colors">
                      Accounts &amp; Lists <ChevronDown className="w-3 h-3 ml-0.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Admin link */}
              {isAuthenticated && user?.role !== 'CUSTOMER' && (
                <Link href="/admin" className="hidden lg:inline text-xs font-bold text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary hover:text-white transition-colors">
                  Admin
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative group cursor-pointer p-2 hover:text-secondary transition-colors flex items-center gap-2"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-[28px] h-[28px]" />
                  <span className="absolute -top-1.5 -right-2 bg-secondary text-white text-[11px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                </div>
                <div className="hidden xl:block text-left pt-2">
                  <p className="text-sm font-bold leading-tight">Cart</p>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden bg-primary/20 p-2 rounded-lg">
            <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border-2 border-white bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 outline-none text-sm placeholder:text-gray-400 text-black"
              />
              <button type="submit" className="bg-primary text-white px-5 hover:bg-primary/80 transition-colors flex items-center justify-center">
                <Search className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Tier 3: Category nav (desktop) ── */}
        <div className="bg-white hidden lg:block border-b border-gray-200">
          <div className="max-w-7xl mx-auto pl-4 flex items-center relative">
            {/* All Departments */}
            <button className="bg-gray-900 text-white flex items-center gap-2 px-5 py-3 font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors mr-6 shrink-0">
              <Menu className="w-[18px] h-[18px]" /> All Departments
            </button>

            {/* Nav items */}
            <nav className="flex items-center justify-start h-[48px] text-[14px] font-bold text-gray-700 flex-1 overflow-x-auto hide-scrollbar">
              {NAV_CATEGORIES.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.slug}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  className={cn(
                    'px-5 h-full flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap relative',
                    activeCategoryIndex === idx ? 'text-primary' : 'hover:text-primary',
                  )}
                >
                  <cat.icon className={cn('w-4 h-4 hidden xl:block', activeCategoryIndex === idx ? 'text-primary' : 'opacity-70')} />
                  {cat.name}
                  {activeCategoryIndex === idx && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                  )}
                </Link>
              ))}
            </nav>

            <Link href="#" className="shrink-0 px-4 h-[48px] flex items-center text-sm font-bold text-secondary hover:text-amber-600 transition-colors ml-auto">
              Deal of the Day <span className="text-red-600 text-lg ml-1">🔥</span>
            </Link>
          </div>
        </div>

        {/* ── Tier 4: Subnav ── */}
        <div className="bg-gray-50 hidden lg:block border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-6 h-[44px] overflow-x-auto hide-scrollbar">
              {activeCategory.subnav.map(sub => (
                <Link
                  key={sub}
                  href={`${activeCategory.slug}?tag=${encodeURIComponent(sub)}`}
                  className="text-[13px] font-bold text-gray-800 hover:text-secondary flex items-center gap-1 whitespace-nowrap transition-colors"
                >
                  {sub} <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 lg:hidden opacity-100 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col overflow-y-auto transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="p-5 bg-gray-900 text-white flex items-center justify-between sticky top-0">
          <div className="text-2xl font-black tracking-tight flex items-center">
            <span>UNKORA</span><span className="text-primary">.SHOP</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User area */}
        <div className="p-5 bg-primary text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center shadow-sm border border-white/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg">{isAuthenticated ? (user?.firstName ?? user?.name) : 'Hello, Sign in'}</p>
            <Link href={isAuthenticated ? '/account' : '/login'} onClick={() => setSidebarOpen(false)} className="text-[13px] font-medium opacity-80 underline decoration-white/60">
              {isAuthenticated ? 'View Account' : 'Your Account'}
            </Link>
          </div>
        </div>

        {/* Category list */}
        <div className="flex flex-col py-4">
          <p className="px-5 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">Our Departments</p>
          {NAV_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={cat.slug}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'py-3.5 px-5 hover:bg-orange-50 font-semibold text-gray-700 flex items-center gap-3 border-b border-gray-100 transition-colors',
                pathname.startsWith(cat.slug) ? 'text-primary bg-accent' : '',
              )}
            >
              <span className="text-primary"><cat.icon className="w-4 h-4" /></span>
              {cat.name}
            </Link>
          ))}
          <Link href="#" onClick={() => setSidebarOpen(false)} className="py-3.5 px-5 hover:bg-orange-50 font-bold text-secondary flex items-center justify-between mt-2">
            <span>Deal of the Day 🔥</span>
          </Link>
        </div>

        {/* Help */}
        <div className="border-t">
          <p className="px-5 pt-4 pb-2 text-lg font-black text-gray-900 tracking-tight">Help &amp; Settings</p>
          <Link href="/account/orders" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary block">Your Orders</Link>
          <Link href="#" className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Deliver to
          </Link>
          <Link href="#" className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Customer Service
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => { void logout.mutate(); setSidebarOpen(false); }}
              className="py-2.5 px-5 text-[15px] font-medium text-red-500 hover:text-red-700 flex items-center gap-2 w-full text-left"
            >
              <X className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
