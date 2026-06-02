'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Package, Tag, Archive, ShoppingBag,
  Truck, Ticket, Users, MessageSquare, LogOut, Menu, X,
  ExternalLink, Bell, Settings, Target, Globe, TrendingUp, Zap,
  ShieldAlert, Plus, ChevronDown, ChevronRight,
  RotateCcw, Bike, FileText, User, Sliders, Gavel, Layers,
  CreditCard, Star, Share2, Monitor, Store, MessageCircle,
  DollarSign, RefreshCw, Bell as BellIcon, Mail, Search, Wallet,
  Users2, PieChart, UserCog, Palette, Sparkles, Bot, Library, ScrollText, Cpu,
  ClipboardList, BookMarked, LayoutList, LifeBuoy, Maximize2, Puzzle, MapPin, Map, Rocket, Megaphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
  { href: '/admin/categories/mega-menu', label: 'Mega Menu', icon: LayoutList },
  {
    label: 'Products', icon: Package,
    children: [
      { href: '/admin/products',                      label: 'All Products',    icon: Package },
      { href: '/admin/products/new',                 label: 'Add New Product', icon: Plus },
      { href: '/admin/inventory',                    label: 'Inventory',       icon: Archive },
      { href: '/admin/inventory/stocks',             label: 'Stock Levels',    icon: Archive },
      { href: '/admin/inventory/suppliers',          label: 'Suppliers',       icon: Store },
      { href: '/admin/inventory/warehouses',         label: 'Warehouses',      icon: Layers },
      { href: '/admin/inventory/purchase-orders',    label: 'Purchase Orders', icon: ClipboardList },
      { href: '/admin/inventory/movements',          label: 'Stock Movements', icon: RefreshCw },
      { href: '/admin/inventory/adjustments',        label: 'Adjustments',     icon: Sliders },
      { href: '/admin/inventory/alerts',             label: 'Low Stock Alerts',icon: ShieldAlert },
      { href: '/admin/products/setup',               label: 'Product Setup',   icon: Sliders },
      { href: '/admin/auctions',                     label: 'Auctions',        icon: Gavel },
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
      { href: '/admin/preorders',    label: 'Preorders',       icon: ClipboardList },
      { href: '/admin/preorders/configurations', label: 'Preorder Config', icon: Sliders },
      { href: '/admin/preorders/orders',         label: 'Preorder Orders', icon: ShoppingBag },
    ],
  },
  {
    label: 'Operations', icon: Monitor,
    children: [
      { href: '/admin/pos',                 label: 'POS Terminal',       icon: Monitor },
      { href: '/admin/sellers',             label: 'Sellers',            icon: Store },
      { href: '/admin/courier',             label: 'Courier',            icon: Truck },
      { href: '/admin/courier/setup',       label: 'Courier Setup',      icon: Settings },
      { href: '/admin/cod-reconciliation',  label: 'COD Reconciliation', icon: DollarSign },
      { href: '/admin/returns',             label: 'Returns',            icon: RefreshCw },
    ],
  },
  {
    label: 'Delivery', icon: Bike,
    children: [
      { href: '/admin/delivery-boys',  label: 'Delivery Boys',  icon: User },
      { href: '/admin/pickup-points',  label: 'Pickup Points',  icon: MapPin },
      { href: '/admin/shipping-zones', label: 'Shipping Zones', icon: Map },
      { href: '/admin/shiprocket',     label: 'Shiprocket',     icon: Rocket },
    ],
  },
  {
    label: 'Community', icon: Users,
    children: [
      { href: '/admin/users',            label: 'Users',             icon: Users },
      { href: '/admin/reviews',          label: 'Reviews',           icon: MessageSquare },
      { href: '/admin/blog',             label: 'Blog',              icon: FileText },
      { href: '/admin/book-submissions', label: 'Book Submissions',  icon: BookMarked },
      { href: '/admin/classifieds',      label: 'Classifieds',       icon: LayoutList },
      { href: '/admin/support',          label: 'Support Tickets',   icon: LifeBuoy },
      { href: '/admin/loyalty',          label: 'Club Points',       icon: Star },
      { href: '/admin/referrals',        label: 'Referrals',         icon: Share2 },
    ],
  },
  {
    label: 'Marketing', icon: TrendingUp,
    children: [
      { href: '/admin/analytics',                        label: 'Analytics Hub',      icon: TrendingUp },
      { href: '/admin/analytics/meta-pixel',             label: 'Meta Pixel',         icon: Target },
      { href: '/admin/analytics/google-analytics',       label: 'Google Analytics',   icon: BarChart3 },
      { href: '/admin/analytics/google-tag-manager',     label: 'Tag Manager',        icon: Tag },
      { href: '/admin/analytics/google-search-console',  label: 'Search Console',     icon: Globe },
      { href: '/admin/sms',                              label: 'SMS',                icon: MessageCircle },
      { href: '/admin/notifications',                    label: 'Push Notifications', icon: BellIcon },
      { href: '/admin/email-campaigns',                  label: 'Email Campaigns',    icon: Mail },
      { href: '/admin/popups',                           label: 'Popups',             icon: Maximize2 },
      { href: '/admin/smart-bar',                        label: 'Smart Bar',          icon: Megaphone },
    ],
  },
  {
    label: 'SEO', icon: Search,
    children: [
      { href: '/admin/seo',                      label: 'SEO Tools',        icon: Search },
      { href: '/admin/seo/settings',             label: 'Global Settings',  icon: Settings },
      { href: '/admin/seo/sitemap',              label: 'Sitemap',          icon: Globe },
      { href: '/admin/seo/robots',               label: 'Robots.txt',       icon: FileText },
      { href: '/admin/seo/redirects',            label: 'Redirects',        icon: RotateCcw },
      { href: '/admin/seo/products',             label: 'Product SEO',      icon: Package },
      { href: '/admin/seo/categories',           label: 'Category SEO',     icon: Layers },
    ],
  },
  {
    label: 'Finance', icon: Wallet,
    children: [
      { href: '/admin/finance/payment-gateways', label: 'Payment Gateways', icon: CreditCard },
      { href: '/admin/finance/payments',         label: 'Transactions',     icon: DollarSign },
    ],
  },
  {
    label: 'AI Studio', icon: Sparkles,
    children: [
      { href: '/admin/ai-studio',               label: 'AI Studio',         icon: Sparkles },
      { href: '/admin/ai-studio/orchestrator',  label: 'Orchestrator',      icon: Cpu },
      { href: '/admin/ai-studio/agents',        label: 'Agents',            icon: Bot },
      { href: '/admin/ai-studio/providers',     label: 'Providers',         icon: Zap },
      { href: '/admin/ai-studio/library',       label: 'Prompt Library',    icon: Library },
      { href: '/admin/ai-studio/logs',          label: 'Logs',              icon: ScrollText },
    ],
  },
  {
    label: 'Growth', icon: TrendingUp,
    children: [
      { href: '/admin/affiliates',        label: 'Affiliates',       icon: Share2 },
      { href: '/admin/segments',          label: 'Segments',         icon: Users2 },
      { href: '/admin/advanced-reports',  label: 'Advanced Reports', icon: PieChart },
    ],
  },
  {
    label: 'Configuration', icon: Settings,
    children: [
      { href: '/admin/localization', label: 'Multi-Currency/Lang', icon: Globe },
      { href: '/admin/design',       label: 'Design Studio',       icon: Palette },
      { href: '/admin/addons',       label: 'Addon Manager',       icon: Puzzle },
      { href: '/admin/staff',        label: 'Staff & Permissions', icon: UserCog },
      { href: '/admin/settings',     label: 'Settings',            icon: Settings },
    ],
  },
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

/* ─── Expandable group — controlled via openGroup ────────────── */
function NavGroupItem({
  item, pathname, isOpen, onToggle, onClose,
}: {
  item: NavParent; pathname: string; isOpen: boolean; onToggle: () => void; onClose?: () => void;
}) {
  const active = groupIsActive(item.children, pathname);

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
          ${active ? 'text-white' : 'text-white/60 hover:text-white/90 hover:bg-white/8'}`}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {isOpen
          ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200" />
          : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200" />}
      </button>

      {isOpen && (
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
  '/admin/pos': 'Point of Sale',
  '/admin/sellers': 'Seller Management',
  '/admin/courier': 'Courier Integration',
  '/admin/sms': 'SMS Notifications',
  '/admin/cod-reconciliation': 'COD Reconciliation',
  '/admin/returns': 'Returns & Exchanges',
  '/admin/notifications': 'Push Notifications',
  '/admin/email-campaigns': 'Email Campaigns',
  '/admin/inventory/stocks': 'Stock Levels',
  '/admin/inventory/suppliers': 'Suppliers',
  '/admin/inventory/warehouses': 'Warehouses',
  '/admin/inventory/purchase-orders': 'Purchase Orders',
  '/admin/inventory/movements': 'Stock Movements',
  '/admin/inventory/adjustments': 'Stock Adjustments',
  '/admin/inventory/alerts': 'Low Stock Alerts',
  '/admin/preorders': 'Preorders',
  '/admin/preorders/configurations': 'Preorder Configurations',
  '/admin/preorders/orders': 'Preorder Orders',
  '/admin/pickup-points': 'Pickup Points',
  '/admin/shipping-zones': 'Shipping Zones',
  '/admin/shiprocket': 'Shiprocket Integration',
  '/admin/book-submissions': 'Book Submissions',
  '/admin/classifieds': 'Classifieds',
  '/admin/support': 'Support Tickets',
  '/admin/popups': 'Popups',
  '/admin/addons': 'Addon Manager',
  '/admin/seo': 'SEO Tools',
  '/admin/seo/settings': 'SEO Global Settings',
  '/admin/seo/sitemap': 'Sitemap',
  '/admin/seo/robots': 'Robots.txt',
  '/admin/seo/redirects': 'Redirects',
  '/admin/seo/products': 'Product SEO',
  '/admin/seo/categories': 'Category SEO',
  '/admin/ai-studio': 'AI Studio',
  '/admin/ai-studio/orchestrator': 'AI Orchestrator',
  '/admin/ai-studio/agents': 'AI Agents',
  '/admin/ai-studio/providers': 'AI Providers',
  '/admin/ai-studio/library': 'Prompt Library',
  '/admin/ai-studio/logs': 'AI Logs',
  '/admin/smart-bar': 'Smart Bar',
  '/admin/localization': 'Multi-Currency & Languages',
  '/admin/affiliates': 'Affiliate Marketing',
  '/admin/segments': 'Customer Segments',
  '/admin/advanced-reports': 'Advanced Reports',
  '/admin/staff': 'Staff & Permissions',
  '/admin/design': 'Design Studio',
  '/admin/categories/mega-menu': 'Mega Menu Editor',
  '/admin/finance/payment-gateways': 'Payment Gateways',
  '/admin/finance/payments': 'Payment Transactions',
  '/admin/courier/setup': 'Courier Setup',
};

/* ─── Sidebar content ────────────────────────────────────────── */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  // Accordion: only one group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    // auto-open the group that contains the current route
    for (const item of NAV) {
      if (isParent(item) && groupIsActive(item.children, pathname)) return item.label;
    }
    return null;
  });

  // When route changes, open the matching group
  useEffect(() => {
    for (const item of NAV) {
      if (isParent(item) && groupIsActive(item.children, pathname)) {
        setOpenGroup(item.label);
        return;
      }
    }
  }, [pathname]);

  const handleToggle = (label: string) => {
    setOpenGroup(prev => (prev === label ? null : label));
  };

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
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 overscroll-contain">
        {NAV.map((item, i) =>
          isParent(item) ? (
            <NavGroupItem
              key={i}
              item={item}
              pathname={pathname}
              isOpen={openGroup === item.label}
              onToggle={() => handleToggle(item.label)}
              onClose={onClose}
            />
          ) : (
            <NavLeafItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          )
        )}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 px-3 py-3 space-y-2 flex-shrink-0">
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

/* ─── Context-aware Quick Nav Bar ───────────────────────────── */
const QUICK_NAV_GROUPS: Record<string, { label: string; href: string }[]> = {
  '/admin/products': [
    { label: 'All Products',   href: '/admin/products' },
    { label: 'Add New',        href: '/admin/products/new' },
    { label: 'Inventory',      href: '/admin/inventory' },
    { label: 'Setup',          href: '/admin/products/setup' },
    { label: 'Auctions',       href: '/admin/auctions' },
  ],
  '/admin/inventory': [
    { label: 'Overview',        href: '/admin/inventory' },
    { label: 'Stocks',          href: '/admin/inventory/stocks' },
    { label: 'Suppliers',       href: '/admin/inventory/suppliers' },
    { label: 'Warehouses',      href: '/admin/inventory/warehouses' },
    { label: 'Purchase Orders', href: '/admin/inventory/purchase-orders' },
    { label: 'Movements',       href: '/admin/inventory/movements' },
    { label: 'Adjustments',     href: '/admin/inventory/adjustments' },
    { label: 'Alerts',          href: '/admin/inventory/alerts' },
  ],
  '/admin/orders': [
    { label: 'All Orders',     href: '/admin/orders' },
    { label: 'Shipments',      href: '/admin/shipments' },
    { label: 'Refunds',        href: '/admin/refunds' },
    { label: 'Returns',        href: '/admin/returns' },
    { label: 'COD Recon',      href: '/admin/cod-reconciliation' },
  ],
  '/admin/sellers': [
    { label: 'Sellers',        href: '/admin/sellers' },
    { label: 'Courier',        href: '/admin/courier' },
    { label: 'COD Recon',      href: '/admin/cod-reconciliation' },
    { label: 'POS',            href: '/admin/pos' },
  ],
  '/admin/analytics': [
    { label: 'Hub',            href: '/admin/analytics' },
    { label: 'Meta Pixel',     href: '/admin/analytics/meta-pixel' },
    { label: 'Google Analytics',href: '/admin/analytics/google-analytics' },
    { label: 'Tag Manager',    href: '/admin/analytics/google-tag-manager' },
    { label: 'Search Console', href: '/admin/analytics/google-search-console' },
  ],
  '/admin/users': [
    { label: 'All Users',      href: '/admin/users' },
    { label: 'Segments',       href: '/admin/segments' },
    { label: 'Loyalty',        href: '/admin/loyalty' },
    { label: 'Referrals',      href: '/admin/referrals' },
  ],
  '/admin/finance': [
    { label: 'Gateways',     href: '/admin/finance/payment-gateways' },
    { label: 'Transactions', href: '/admin/finance/payments' },
  ],
  '/admin/settings': [
    { label: 'General',        href: '/admin/settings' },
    { label: 'Design',         href: '/admin/design' },
    { label: 'Localization',   href: '/admin/localization' },
    { label: 'Staff',          href: '/admin/staff' },
    { label: 'SEO',            href: '/admin/seo' },
  ],
};

// ADD_NEW map: what "+ Add New" should link to per section
const ADD_NEW_MAP: Record<string, string> = {
  '/admin/products':  '/admin/products/new',
  '/admin/blog':      '/admin/blog/new',
  '/admin/coupons':   '/admin/coupons',
  '/admin/gift-cards':'/admin/gift-cards',
  '/admin/auctions':  '/admin/auctions',
};

function QuickNavBar() {
  const pathname = usePathname();

  // Find matching group by prefix
  const groupKey = Object.keys(QUICK_NAV_GROUPS).find(k => pathname.startsWith(k));
  const tabs = groupKey ? QUICK_NAV_GROUPS[groupKey] : null;

  const addNewHref = Object.entries(ADD_NEW_MAP).find(([k]) => pathname.startsWith(k))?.[1];

  if (!tabs) return null;

  return (
    <div className="sticky top-[57px] z-30 border-b bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-1 px-3 sm:px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Icon shortcuts */}
        <div className="flex items-center gap-1 pr-2 mr-1 border-r border-border flex-shrink-0">
          <Link href="/" target="_blank"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="View Store">
            <Globe className="h-3.5 w-3.5" />
          </Link>
          <Link href="/admin/pos"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="POS Terminal">
            <Monitor className="h-3.5 w-3.5" />
          </Link>
          <Link href="/admin/advanced-reports"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Reports">
            <PieChart className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Context tabs */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto [scrollbar-width:none]">
          {tabs.map(tab => {
            const active = pathname === tab.href || (tab.href !== groupKey && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap
                  ${active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Add New button */}
        {addNewHref && (
          <Link href={addNewHref}
            className="flex-shrink-0 ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add New</span>
            <span className="sm:hidden">+</span>
          </Link>
        )}
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
  const [clearing, setClearing] = useState(false);
  const queryClient = useQueryClient();

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    queryClient.clear();
    await new Promise(r => setTimeout(r, 400));
    setClearing(false);
    window.location.reload();
  }, [queryClient]);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!isAuthenticated) { router.push('/admin/login'); return; }
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') router.push('/');
  }, [isAuthenticated, user, router, pathname]);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Login page renders without the admin shell
  if (pathname === '/admin/login') return <>{children}</>;

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
      {/* Desktop Sidebar — sticky full height */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm">
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
              <h1 className="font-semibold text-foreground text-sm sm:text-base">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Context-aware Add New */}
            {(() => {
              const addHref = Object.entries(ADD_NEW_MAP).find(([k]) => pathname.startsWith(k))?.[1];
              return addHref ? (
                <Link
                  href={addHref}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add New</span>
                </Link>
              ) : null;
            })()}

            {/* View Store */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Store
              <ExternalLink className="h-3 w-3" />
            </Link>

            {/* Clear cache */}
            <button
              onClick={handleClearCache}
              disabled={clearing}
              title="Clear cache & reload"
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${clearing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        <QuickNavBar />
        <main className="flex-1 p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
