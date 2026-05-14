'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Ticket, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') router.push('/');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) return null;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push('/');
  };

  const NavLinks = () => (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Admin Panel</p>
      </div>
      <nav className="space-y-1">
        {navItems.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4" /> {item.label}
              </span>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r bg-card p-4">
        <div className="mb-6">
          <Link href="/" className="font-serif text-xl font-bold text-brand-600">UNKORA</Link>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 border-r bg-card p-4">
            <NavLinks />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <Link href="/" className="font-serif text-lg font-bold text-brand-600">UNKORA Admin</Link>
          <button onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
