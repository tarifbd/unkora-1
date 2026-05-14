'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, User, BookOpen, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/lib/hooks/use-auth';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/books', label: 'Books' },
  { href: '/products', label: 'All Products' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemCount = cart?.itemCount ?? 0;

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold shrink-0">
          <BookOpen className="h-5 w-5 text-brand-600" />
          <span>UNKORA</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-brand-600',
                pathname === link.href ? 'text-brand-600' : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-9 w-44 rounded-l-md border border-r-0 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
              />
              <button type="submit" className="flex h-9 items-center rounded-r-md border bg-primary px-3 text-primary-foreground hover:bg-primary/90 transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} className="ml-1 flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors" title={user?.name}>
                <User className="h-4 w-4" />
              </Link>
              {user?.role !== 'CUSTOMER' && (
                <Link href="/admin" className="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">Admin</Link>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-1">
              <Link href="/login" className="text-sm font-medium hover:text-brand-600 transition-colors">Sign in</Link>
              <Link href="/register" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  pathname === link.href ? 'bg-accent text-brand-600' : 'text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-1 border-t pt-2">
              {isAuthenticated ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">My Account</Link>
                  {user?.role !== 'CUSTOMER' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Admin Panel</Link>
                  )}
                  <button onClick={() => { void logout.mutate(); setMobileOpen(false); }} className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Sign in</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Sign up</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
