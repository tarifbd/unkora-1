'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Tag,
  Archive,
  ShoppingBag,
  Truck,
  Ticket,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Bell,
  Settings,
  Target,
  Globe,
  TrendingUp,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useEffect, useState } from 'react';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'CATALOG',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/inventory', label: 'Inventory', icon: Archive },
    ],
  },
  {
    label: 'SALES',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/shipments', label: 'Shipments', icon: Truck },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { href: '/admin/promotions', label: 'Promotions', icon: Zap },
      { href: '/admin/fraud', label: 'Fraud Detection', icon: ShieldAlert },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { href: '/admin/analytics', label: 'Analytics Hub', icon: TrendingUp },
      { href: '/admin/analytics/meta-pixel', label: 'Meta Pixel', icon: Target },
      { href: '/admin/analytics/google-analytics', label: 'Google Analytics', icon: BarChart3 },
      { href: '/admin/analytics/google-tag-manager', label: 'Tag Manager', icon: Tag },
      { href: '/admin/analytics/google-search-console', label: 'Search Console', icon: Globe },
    ],
  },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  pathname: string;
  onClose?: () => void;
}) {
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
      <span>{label}</span>
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
      )}
    </Link>
  );
}

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

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const pageTitleMap: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/reports': 'Reports & Analytics',
    '/admin/products': 'Products',
    '/admin/categories': 'Categories',
    '/admin/inventory': 'Inventory',
    '/admin/orders': 'Orders',
    '/admin/shipments': 'Shipments',
    '/admin/coupons': 'Coupons',
    '/admin/users': 'Users',
    '/admin/reviews': 'Reviews',
    '/admin/settings': 'Settings',
    '/admin/analytics': 'Marketing Analytics',
    '/admin/analytics/meta-pixel': 'Meta Pixel & CAPI',
    '/admin/analytics/google-analytics': 'Google Analytics 4',
    '/admin/analytics/google-tag-manager': 'Google Tag Manager',
    '/admin/analytics/google-search-console': 'Search Console',
  };

  const pageTitle =
    pageTitleMap[pathname] ??
    Object.entries(pageTitleMap)
      .reverse()
      .find(([k]) => pathname.startsWith(k))?.[1] ??
    'Admin';

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div>
          <Link href="/" className="font-serif text-xl font-bold text-primary">
            UNKORA
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin Panel
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem
                  key={item.href}
                  {...item}
                  pathname={pathname}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Settings at bottom of nav */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            SYSTEM
          </p>
          <div className="space-y-0.5">
            <NavItem
              href="/admin/settings"
              label="Settings"
              icon={Settings}
              pathname={pathname}
              onClose={onClose}
            />
          </div>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="border-t px-3 py-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Admin'}</p>
            <span className="inline-flex items-center rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r bg-card lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 border-r bg-card shadow-xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Page title */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:block">
                Admin Panel
              </p>
              <h1 className="font-semibold text-foreground">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Store link */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              View Store
              <ExternalLink className="h-3 w-3" />
            </Link>

            {/* Bell */}
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
              <Bell className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
