'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Package, Tag, Archive, ShoppingBag,
  Truck, Ticket, Users, MessageSquare, LogOut, Menu, X,
  ExternalLink, Bell, Settings, Target, Globe, TrendingUp, Zap,
  ShieldAlert, Plus, ChevronDown, ChevronRight,
  RotateCcw, Bike, FileText, User, Sliders, Gavel, Layers,
  CreditCard, Star, Share2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useEffect, useState } from 'react';

/* ─── Nav tree structure ─────────────────────────────────────── */
type NavLeaf = { href: string; label: string; icon: React.ElementType; exact?: boolean };
type NavParent = { label: string; icon: React.ElementType; children: NavLeaf[] };
type NavItem = NavLeaf | NavParent;

function isParent(item: NavItem): item is NavParent {
  return 'children' in item;
}

const NAV: NavItem[] = [
  { href: '/admin',   label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  {
    label: 'Products', icon: Package,
    children: [
      { href: '/admin/products',             label: 'All Products',    icon: Package },
      { href: '/admin/products/new',         label: 'Add New Product', icon: Plus },
      { href: '/admin/inventory',            label: 'Inventory',       icon: Archive },
      { href: '/admin/products/setup',       label: 'Product Setup',   icon: Sliders },
      { href: '/admin/auctions',             label: 'Auctions',        icon: Gavel },
    ],
  },
  {
    label: 'Sales', icon: ShoppingBag,
    children: [
      { href: '/admin/orders',       label: 'Orders',          icon: ShoppingBag },
      { href: '/admin/shipments',    label: 'Shipments',       icon: Truck },
      { href: '/admin/coupons',      label: 'Coupons',         icon: Ticket },
      { href: '/admin/promotions',   label: 'Promotions',      icon: Zap },
      { href: '/admin/refunds',      label: 'Refunds',         icon: RotateCcw },
      { href: '/admin/flash-deals',  label: 'Flash Deals',     icon: Zap },
      { href: '/admin/wholesale',    label: 'Wholesale',       icon: Layers },
      { href: '/admin/gift-cards',   label: 'Gift Cards',      icon: CreditCard },
      { href: '/admin/fraud',        label: 'Fraud Detection', icon: ShieldAlert },
    ],
  },
  {
    label: 'Delivery', icon: Bike,
    children: [
      { href: '/admin/delivery-boys', label: 'Delivery Boys', icon: User },
    ],
  },
  {
    label: 'Community', icon: Users,
    children: [
      { href: '/admin/users',     label: 'Users',         icon: Users },
      { href: '/admin/reviews',   label: 'Reviews',       icon: MessageSquare },
      { href: '/admin/blog',      label: 'Blog',          icon: FileText },
      { href: '/admin/loyalty',   label: 'Club Points',   icon: Star },
      { href: '/admin/referrals', label: 'Referrals',     icon: Share2 },
    ],
  },
  {
    label: 'Marketing', icon: TrendingUp,
    children: [
      { href: '/admin/analytics',                        label: 'Analytics Hub',    icon: TrendingUp },
      { href: '/admin/analytics/meta-pixel',             label: 'Meta Pixel',       icon: Target },
      { href: '/admin/analytics/google-analytics',       label: 'Google Analytics', icon: BarChart3 },
      { href: '/admin/analytics/google-tag-manager',     label: 'Tag Manager',      icon: Tag },
      { href: '/admin/analytics/google-search-console',  label: 'Search Console',   icon: Globe },
    ],
  },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function isActive(href: string, pathname: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}
function groupIsActive(children: NavLeaf[], pathname: string) {
  return children.some(c => isActive(c.href, pathname, c.exact));
}

/* ─── Single leaf link ───────────────────────────────────────── */
function NavLeafItem({
  item, pathname, depth = 0, onClose,
}: {
  item: NavLeaf; pathname: string; depth?: number; onClose?: () => void;
}) {
  const active = isActive(item.href, pathname, item.exact);
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all
        ${depth > 0 ? 'pl-10 pr-3' : 'px-3'}
        ${active
          ? 'bg-white/15 text-white'
          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
        }`}
    >
      {depth > 0 ? (
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-white/30'}`} />
      ) : (
        <item.icon className="h-4 w-4 flex-shrink-0" />
      )}
      <span className="truncate">{item.label}</span>
      {active && depth === 0 && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
      )}
    </Link>
  );
}

/* ─── Expandable group ───────────────────────────────────────── */
function NavGroupItem({
  item, pathname, onClose,
}: {
  item: NavParent; pathname: string; onClose?: () => void;
}) {
  const active = groupIsActive(item.children, pathname);
  const [open, setOpen] = useState(active);

  // auto-open when navigating into this group
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
          ${active ? 'text-white' : 'text-white/60 hover:text-white/90 hover:bg-white/8'}`}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 transition-transform" />
          : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 transition-transform" />}
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map(child => (
            <NavLeafItem key={child.href} item={child} pathname={pathname} depth={1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page title map ─────────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/reports': 'Reports & Analytics',
  '/admin/products': 'Products',
  '/admin/products/new': 'Add New Product',
  '/admin/products/setup': 'Product Setup',
  '/admin/products/setup/brands': 'Brands',
  '/admin/products/setup/colors': 'Colors',
  '/admin/products/setup/attributes': 'Attributes',
  '/admin/products/setup/size-guides': 'Size Guides',
  '/admin/products/setup/warranties': 'Warranties',
  '/admin/products/setup/labels': 'Product Labels',
  '/admin/auctions': 'Auctions',
  '/admin/wholesale': 'Wholesale Pricing',
  '/admin/gift-cards': 'Gift Cards',
  '/admin/loyalty': 'Club Points',
  '/admin/referrals': 'Referral Program',
  '/admin/categories': 'Categories',
  '/admin/inventory': 'Inventory',
  '/admin/orders': 'Orders',
  '/admin/shipments': 'Shipments',
  '/admin/coupons': 'Coupons',
  '/admin/promotions': 'Promotions',
  '/admin/fraud': 'Fraud Detection',
  '/admin/users': 'Users',
  '/admin/reviews': 'Reviews',
  '/admin/settings': 'Settings',
  '/admin/refunds': 'Refunds',
  '/admin/flash-deals': 'Flash Deals',
  '/admin/delivery-boys': 'Delivery Boys',
  '/admin/blog/new': 'New Blog Post',
  '/admin/blog': 'Blog',
  '/admin/analytics': 'Marketing Analytics',
  '/admin/analytics/meta-pixel': 'Meta Pixel & CAPI',
  '/admin/analytics/google-analytics': 'Google Analytics 4',
  '/admin/analytics/google-tag-manager': 'Google Tag Manager',
  '/admin/analytics/google-search-console': 'Search Console',
};

/* ─── Sidebar content ────────────────────────────────────────── */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push('/');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  return (
    <div className="flex h-full flex-col" style={{ background: '#0d1b3e' }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div>
          <Link href="/" className="font-serif text-xl font-black text-white tracking-wide">
            UNKORA
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Admin Panel
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 text-white/40 hover:text-white hover:bg-white/10 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item, i) =>
          isParent(item) ? (
            <NavGroupItem key={i} item={item} pathname={pathname} onClose={onClose} />
          ) : (
            <NavLeafItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          )
        )}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 px-3 py-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
            </p>
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,100,100,0.85)' }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Layout ─────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') router.push('/');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) return null;

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const pageTitle =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).reverse().find(([k]) => pathname.startsWith(k))?.[1] ??
    'Admin';

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 shadow-2xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:block">
                Admin Panel
              </p>
              <h1 className="font-semibold text-foreground">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              View Store
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
              <Bell className="h-4 w-4" />
            </button>
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
