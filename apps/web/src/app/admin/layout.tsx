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
  FileCode2, Percent, LineChart, Gift, Database, Lock, Radio, Sun, ImageIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/* ─── Nav tree structure ─────────────────────────────────────── */
type NavLeaf = { href: string; label: string; icon: React.ElementType; exact?: boolean; keywords?: string[] };
type NavParent = { label: string; icon: React.ElementType; children: NavLeaf[] };
type NavDivider = { type: 'divider'; label: string };
type NavItem = NavLeaf | NavParent | NavDivider;

function isParent(item: NavItem): item is NavParent {
  return 'children' in item && !('type' in item);
}
function isDivider(item: NavItem): item is NavDivider {
  return 'type' in item && item.type === 'divider';
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, keywords: ['home', 'overview', 'summary', 'kpi'] },

  /* ───── CATALOGUE ───── */
  { type: 'divider', label: 'CATALOGUE' },
  {
    label: 'Categories', icon: Tag,
    children: [
      { href: '/admin/categories',           label: 'All Categories', icon: Tag,        keywords: ['category', 'taxonomy', 'tree', 'department'] },
      { href: '/admin/categories/mega-menu', label: 'Mega Menu',      icon: LayoutList, keywords: ['navigation', 'menu', 'header', 'dropdown'] },
      { href: '/admin/seo/categories',       label: 'Category SEO',   icon: Layers,     keywords: ['meta', 'seo', 'optimization'] },
    ],
  },
  {
    label: 'Catalogue', icon: Package,
    children: [
      { href: '/admin/products',                 label: 'All Products',    icon: Package,  keywords: ['catalog', 'item', 'sku', 'goods', 'merchandise'] },
      { href: '/admin/products/new',             label: 'Add New Product', icon: Plus,     keywords: ['create', 'add', 'new'] },
      { href: '/admin/products/setup',           label: 'Product Setup',   icon: Sliders,  keywords: ['config', 'configuration'] },
      { href: '/admin/products/setup/brands',    label: 'Brands',          icon: Store,    keywords: ['manufacturer', 'maker'] },
      { href: '/admin/products/setup/colors',    label: 'Colors',          icon: Palette,  keywords: ['variant', 'swatch'] },
      { href: '/admin/products/setup/attributes',label: 'Attributes',      icon: Sliders,  keywords: ['variant', 'option', 'spec'] },
      { href: '/admin/products/setup/size-guides',label: 'Size Guides',    icon: LayoutList,keywords: ['sizing', 'measurement'] },
      { href: '/admin/products/setup/warranties',label: 'Warranties',      icon: ShieldAlert,keywords: ['guarantee'] },
      { href: '/admin/products/setup/labels',    label: 'Product Labels',  icon: Tag,      keywords: ['badge', 'tag'] },
      { href: '/admin/seo/products',             label: 'Product SEO',     icon: Search,   keywords: ['meta', 'optimization'] },
      { href: '/admin/auctions',                 label: 'Auctions',        icon: Gavel,    keywords: ['bid', 'bidding'] },
      { href: '/admin/wholesale',                label: 'Wholesale',       icon: Layers,   keywords: ['bulk', 'b2b', 'tier', 'pricing'] },
    ],
  },
  {
    label: 'Inventory & Stock', icon: Archive,
    children: [
      { href: '/admin/inventory',                 label: 'Inventory Overview', icon: Archive,       keywords: ['stock', 'warehouse'] },
      { href: '/admin/inventory/stocks',          label: 'Stock Levels',       icon: Archive,       keywords: ['quantity', 'on hand'] },
      { href: '/admin/inventory/suppliers',       label: 'Suppliers',          icon: Store,         keywords: ['vendor', 'procurement', 'source'] },
      { href: '/admin/inventory/warehouses',      label: 'Warehouses',         icon: Layers,        keywords: ['location', 'storage'] },
      { href: '/admin/inventory/purchase-orders', label: 'Purchase Orders',    icon: ClipboardList, keywords: ['po', 'procurement', 'restock', 'buy'] },
      { href: '/admin/inventory/movements',       label: 'Stock Movements',    icon: RefreshCw,     keywords: ['transfer', 'log'] },
      { href: '/admin/inventory/adjustments',     label: 'Adjustments',        icon: Sliders,       keywords: ['correction', 'count'] },
      { href: '/admin/inventory/alerts',          label: 'Low Stock Alerts',   icon: ShieldAlert,   keywords: ['reorder', 'threshold'] },
    ],
  },

  /* ───── SALES ───── */
  { type: 'divider', label: 'SALES' },
  {
    label: 'Orders', icon: ShoppingBag,
    children: [
      { href: '/admin/orders',                   label: 'All Orders',          icon: ShoppingBag,   keywords: ['sales', 'purchase', 'invoice', 'transaction'] },
      { href: '/admin/returns',                  label: 'Returns & Exchanges', icon: RefreshCw,     keywords: ['rma', 'exchange'] },
      { href: '/admin/refunds',                  label: 'Refunds',             icon: RotateCcw,     keywords: ['money back', 'reverse'] },
      { href: '/admin/cod-reconciliation',       label: 'COD Reconciliation',  icon: DollarSign,    keywords: ['cash on delivery', 'collection'] },
      { href: '/admin/preorders',                label: 'Preorders',           icon: ClipboardList, keywords: ['advance', 'reserve'] },
      { href: '/admin/preorders/configurations', label: 'Preorder Config',     icon: Sliders,       keywords: ['setup'] },
      { href: '/admin/preorders/orders',         label: 'Preorder Orders',     icon: ShoppingBag },
    ],
  },
  {
    label: 'Shipping & Delivery', icon: Truck,
    children: [
      { href: '/admin/shipments',      label: 'Shipments',      icon: Truck,    keywords: ['fulfillment', 'tracking', 'dispatch'] },
      { href: '/admin/courier',        label: 'Courier',        icon: Truck,    keywords: ['logistics', 'carrier'] },
      { href: '/admin/courier/setup',  label: 'Courier Setup',  icon: Settings, keywords: ['config', 'integration'] },
      { href: '/admin/shipping-zones', label: 'Shipping Zones', icon: Map,      keywords: ['region', 'rate', 'area'] },
      { href: '/admin/pickup-points',  label: 'Pickup Points',  icon: MapPin,   keywords: ['collection', 'location'] },
      { href: '/admin/delivery-boys',  label: 'Delivery Boys',  icon: Bike,     keywords: ['rider', 'agent', 'driver'] },
      { href: '/admin/shiprocket',     label: 'Shiprocket',     icon: Rocket,   keywords: ['integration', 'logistics'] },
    ],
  },
  {
    label: 'POS & Sellers', icon: Monitor,
    children: [
      { href: '/admin/pos',        label: 'POS Terminal', icon: Monitor,    keywords: ['point of sale', 'cashier', 'retail', 'register'] },
      { href: '/admin/sellers',    label: 'Sellers',      icon: Store,      keywords: ['vendor', 'marketplace', 'merchant'] },
      { href: '/admin/gift-cards', label: 'Gift Cards',   icon: CreditCard, keywords: ['voucher', 'prepaid'] },
    ],
  },
  {
    label: 'Promotions', icon: Zap,
    children: [
      { href: '/admin/flash-deals',     label: 'Flash Deals',     icon: Zap,    keywords: ['discount', 'offer', 'sale', 'limited'] },
      { href: '/admin/deal-of-the-day', label: 'Deal of the Day', icon: Sun,    keywords: ['daily', 'offer', 'discount'] },
      { href: '/admin/coupons',         label: 'Coupons',         icon: Ticket, keywords: ['voucher', 'promo code', 'discount'] },
      { href: '/admin/promotions',      label: 'Promotions',      icon: Zap,    keywords: ['campaign', 'discount', 'offer'] },
    ],
  },

  /* ───── CUSTOMERS ───── */
  { type: 'divider', label: 'CUSTOMERS' },
  {
    label: 'Customers', icon: Users,
    children: [
      { href: '/admin/users',            label: 'All Customers',    icon: Users,         keywords: ['user', 'buyer', 'account', 'member'] },
      { href: '/admin/segments',         label: 'Segments',         icon: Users2,        keywords: ['group', 'cohort', 'audience'] },
      { href: '/admin/reviews',          label: 'Reviews',          icon: MessageSquare, keywords: ['rating', 'feedback', 'comment'] },
      { href: '/admin/support',          label: 'Support Tickets',  icon: LifeBuoy,      keywords: ['help', 'desk', 'complaint'] },
      { href: '/admin/loyalty',          label: 'Club Points',      icon: Star,          keywords: ['loyalty', 'rewards', 'points'] },
      { href: '/admin/referrals',        label: 'Referrals',        icon: Share2,        keywords: ['invite', 'refer'] },
      { href: '/admin/book-submissions', label: 'Book Submissions', icon: BookMarked,    keywords: ['author', 'manuscript'] },
      { href: '/admin/classifieds',      label: 'Classifieds',      icon: LayoutList,    keywords: ['listing', 'ads'] },
      { href: '/admin/fraud',            label: 'Fraud Detection',  icon: ShieldAlert,   keywords: ['risk', 'security', 'suspicious'] },
    ],
  },

  /* ───── MARKETING ───── */
  { type: 'divider', label: 'MARKETING' },
  {
    label: 'Marketing', icon: Megaphone,
    children: [
      { href: '/admin/email-campaigns', label: 'Email Campaigns',    icon: Mail,          keywords: ['newsletter', 'broadcast'] },
      { href: '/admin/sms',             label: 'SMS',                icon: MessageCircle, keywords: ['text', 'message'] },
      { href: '/admin/notifications',   label: 'Push Notifications', icon: BellIcon,      keywords: ['alert', 'web push'] },
      { href: '/admin/popups',          label: 'Popups',             icon: Maximize2,     keywords: ['modal', 'banner'] },
      { href: '/admin/smart-bar',       label: 'Smart Bar',          icon: Megaphone,     keywords: ['announcement', 'banner'] },
      { href: '/admin/affiliates',      label: 'Affiliates',         icon: Share2,        keywords: ['partner', 'commission'] },
    ],
  },
  {
    label: 'Analytics', icon: TrendingUp,
    children: [
      { href: '/admin/analytics',                       label: 'Analytics Hub',    icon: TrendingUp, keywords: ['stats', 'metrics', 'insights'] },
      { href: '/admin/analytics/meta-pixel',            label: 'Meta Pixel',       icon: Target,     keywords: ['facebook', 'capi', 'tracking'] },
      { href: '/admin/analytics/google-analytics',      label: 'Google Analytics', icon: BarChart3,  keywords: ['ga4', 'tracking'] },
      { href: '/admin/analytics/google-tag-manager',    label: 'Tag Manager',      icon: Tag,        keywords: ['gtm', 'tracking'] },
      { href: '/admin/analytics/google-search-console', label: 'Search Console',   icon: Globe,      keywords: ['gsc', 'indexing'] },
    ],
  },

  /* ───── CHANNELS ───── */
  { type: 'divider', label: 'CHANNELS' },
  {
    label: 'Sales Channels', icon: Share2,
    children: [
      { href: '/admin/channels/facebook',  label: 'Facebook',        icon: Share2,        keywords: ['social', 'fb', 'shop'] },
      { href: '/admin/channels/instagram', label: 'Instagram',       icon: Star,          keywords: ['social', 'ig', 'shop'] },
      { href: '/admin/channels/google',    label: 'Google Shopping', icon: Globe,         keywords: ['merchant', 'feed'] },
      { href: '/admin/channels/whatsapp',  label: 'WhatsApp',        icon: MessageCircle, keywords: ['social', 'chat'] },
      { href: '/admin/channels/live',      label: 'Live Commerce',   icon: Radio,         keywords: ['stream', 'broadcast'] },
    ],
  },

  /* ───── CONTENT ───── */
  { type: 'divider', label: 'CONTENT' },
  {
    label: 'Content', icon: FileText,
    children: [
      { href: '/admin/cms',         label: 'Static Pages',      icon: FileCode2, keywords: ['about', 'contact', 'privacy', 'terms', 'faq', 'page'] },
      { href: '/admin/cms/banners', label: 'Banners & Sliders', icon: ImageIcon, keywords: ['hero', 'carousel', 'slideshow'] },
      { href: '/admin/blog',        label: 'Blog',              icon: FileText,  keywords: ['article', 'post', 'news'] },
      { href: '/admin/blog/new',    label: 'New Post',          icon: Plus,      keywords: ['write', 'article'] },
    ],
  },

  /* ───── SEO & VISIBILITY ───── */
  { type: 'divider', label: 'SEO & VISIBILITY' },
  {
    label: 'SEO Tools', icon: Search,
    children: [
      { href: '/admin/seo',                 label: 'SEO Overview',      icon: Search,    keywords: ['optimization', 'ranking'] },
      { href: '/admin/seo/settings',        label: 'Global Settings',   icon: Settings,  keywords: ['meta', 'config'] },
      { href: '/admin/seo/sitemap',         label: 'Sitemap',           icon: Globe,     keywords: ['xml', 'index'] },
      { href: '/admin/seo/robots',          label: 'Robots.txt',        icon: FileText,  keywords: ['crawl', 'index'] },
      { href: '/admin/seo/redirects',       label: 'Redirects',         icon: RotateCcw, keywords: ['301', 'url'] },
      { href: '/admin/seo/products',        label: 'Product SEO',       icon: Package,   keywords: ['meta'] },
      { href: '/admin/seo/categories',      label: 'Category SEO',      icon: Layers,    keywords: ['meta'] },
      { href: '/admin/seo/aeo',             label: 'AEO',               icon: Bot,       keywords: ['answer engine', 'ai'] },
      { href: '/admin/seo/geo',             label: 'GEO',               icon: Globe,     keywords: ['generative engine', 'ai'] },
      { href: '/admin/seo/aio',             label: 'AI Overview (AIO)', icon: Bot,       keywords: ['ai overview', 'sge'] },
      { href: '/admin/seo/advanced-search', label: 'Advanced Search',   icon: Search,    keywords: ['site search', 'index'] },
    ],
  },

  /* ───── INTELLIGENCE ───── */
  { type: 'divider', label: 'INTELLIGENCE' },
  {
    label: 'Reports & AI', icon: Sparkles,
    children: [
      { href: '/admin/reports',                label: 'Reports',          icon: BarChart3, keywords: ['report', 'sales report'] },
      { href: '/admin/advanced-reports',       label: 'Advanced Reports', icon: PieChart,  keywords: ['analytics', 'export'] },
      { href: '/admin/ai-studio',              label: 'AI Studio',        icon: Sparkles,  keywords: ['artificial intelligence', 'gpt'] },
      { href: '/admin/ai-studio/orchestrator', label: 'Orchestrator',     icon: Cpu,       keywords: ['workflow', 'automation'] },
      { href: '/admin/ai-studio/agents',       label: 'Agents',           icon: Bot,       keywords: ['assistant', 'bot'] },
      { href: '/admin/ai-studio/providers',    label: 'Providers',        icon: Zap,       keywords: ['openai', 'anthropic', 'model'] },
      { href: '/admin/ai-studio/library',      label: 'Prompt Library',   icon: Library,   keywords: ['template', 'prompt'] },
      { href: '/admin/ai-studio/logs',         label: 'AI Logs',          icon: ScrollText,keywords: ['history', 'usage'] },
    ],
  },

  /* ───── FINANCE ───── */
  { type: 'divider', label: 'FINANCE' },
  {
    label: 'Finance', icon: Wallet,
    children: [
      { href: '/admin/finance/payment-gateways', label: 'Payment Gateways', icon: CreditCard, keywords: ['bkash', 'nagad', 'stripe', 'gateway'] },
      { href: '/admin/finance/payments',         label: 'Transactions',     icon: DollarSign, keywords: ['payment', 'ledger'] },
      { href: '/admin/finance/tax',              label: 'Tax Settings',     icon: Percent,    keywords: ['vat', 'gst'] },
      { href: '/admin/finance/pnl',              label: 'P&L Report',       icon: LineChart,  keywords: ['profit', 'loss', 'income'] },
      { href: '/admin/finance/wallet',           label: 'Digital Wallet',   icon: Wallet,     keywords: ['balance', 'credit'] },
      { href: '/admin/finance/store-credit',     label: 'Store Credit',     icon: Gift,       keywords: ['credit', 'refund'] },
    ],
  },

  /* ───── SYSTEM ───── */
  { type: 'divider', label: 'SYSTEM' },
  {
    label: 'System', icon: Settings,
    children: [
      { href: '/admin/settings',       label: 'Settings',            icon: Settings, keywords: ['config', 'general', 'preferences'] },
      { href: '/admin/design',         label: 'Design Studio',       icon: Palette,  keywords: ['theme', 'appearance', 'brand'] },
      { href: '/admin/localization',   label: 'Multi-Currency/Lang', icon: Globe,    keywords: ['language', 'currency', 'translation', 'i18n'] },
      { href: '/admin/addons',         label: 'Addon Manager',       icon: Puzzle,   keywords: ['plugin', 'extension', 'module'] },
      { href: '/admin/staff',          label: 'Staff & Permissions', icon: UserCog,  keywords: ['team', 'employee', 'role'] },
      { href: '/admin/security/audit', label: 'Audit Logs',          icon: Database, keywords: ['activity', 'history', 'log'] },
      { href: '/admin/security/rbac',  label: 'RBAC',                icon: Lock,     keywords: ['role', 'access control', 'permission'] },
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

/* ─── Flattened search index (built once) ────────────────────── */
type SearchEntry = { leaf: NavLeaf; parent: string; haystack: string };
const SEARCH_INDEX: SearchEntry[] = (() => {
  const entries: SearchEntry[] = [];
  const seen = new Set<string>();
  for (const item of NAV) {
    if (isDivider(item)) continue;
    if (isParent(item)) {
      for (const child of item.children) {
        if (seen.has(child.href)) continue;
        seen.add(child.href);
        entries.push({
          leaf: child,
          parent: item.label,
          haystack: [child.label, item.label, ...(child.keywords ?? [])].join(' ').toLowerCase(),
        });
      }
    } else {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      entries.push({
        leaf: item,
        parent: 'General',
        haystack: [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase(),
      });
    }
  }
  return entries;
})();

// Multi-word AND search across labels + parent + keyword synonyms.
// Ranks exact-label and label-prefix matches above keyword-only matches.
function searchNav(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of SEARCH_INDEX) {
    if (!tokens.every(t => entry.haystack.includes(t))) continue;
    const label = entry.leaf.label.toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else score = 30; // matched via parent or keyword only
    scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.leaf.label.localeCompare(b.entry.leaf.label));
  return scored.map(s => s.entry);
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
  '/admin/cms': 'Static Pages',
  '/admin/cms/pages': 'CMS Pages',
  '/admin/cms/banners': 'Banners & Sliders',
  '/admin/channels/facebook': 'Facebook Channel',
  '/admin/channels/instagram': 'Instagram Channel',
  '/admin/channels/google': 'Google Shopping',
  '/admin/channels/whatsapp': 'WhatsApp Channel',
  '/admin/channels/live': 'Live Commerce',
  '/admin/seo/advanced-search': 'Advanced Search',
  '/admin/finance/tax': 'Tax Settings',
  '/admin/finance/pnl': 'P&L Report',
  '/admin/finance/wallet': 'Digital Wallet',
  '/admin/finance/store-credit': 'Store Credit',
  '/admin/security/audit': 'Audit Logs',
  '/admin/security/rbac': 'Role-Based Access Control',
  '/admin/deal-of-the-day': 'Deal of the Day',
  '/admin/seo/aeo': 'Answer Engine Optimization (AEO)',
  '/admin/seo/geo': 'Generative Engine Optimization (GEO)',
  '/admin/seo/aio': 'AI Overview Optimization (AIO)',
};

/* ─── Sidebar content ────────────────────────────────────────── */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Powerful search: multi-word, keyword synonyms, ranked + deduped
  const searchResults = useMemo(() => searchNav(searchQuery), [searchQuery]);

  // Accordion: only one group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    // auto-open the group that contains the current route
    for (const item of NAV) {
      if (isParent(item) && groupIsActive(item.children, pathname)) return item.label;
    }
    return null;
  });

  // When route changes, open the matching group and clear search
  useEffect(() => {
    setSearchQuery('');
    for (const item of NAV) {
      if (isParent(item) && groupIsActive(item.children, pathname)) {
        setOpenGroup(item.label);
        return;
      }
    }
  }, [pathname]);

  // Reset keyboard selection whenever the query (and thus results) changes
  useEffect(() => { setActiveIndex(0); }, [searchQuery]);

  // Keyboard navigation over search results: ↑ ↓ Enter Esc
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) {
      if (e.key === 'Escape') setSearchQuery('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = searchResults[activeIndex];
      if (target) {
        setSearchQuery('');
        onClose?.();
        router.push(target.leaf.href);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  // Keep the highlighted result scrolled into view
  useEffect(() => {
    const el = resultsRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

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

      {/* Search */}
      <div className="px-3 pt-3 pb-2 border-b border-white/8 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search anything…  (try 'po', 'vendor', 'vat')"
            className="w-full bg-white/8 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Nav — search results or full tree */}
      {searchQuery.trim() ? (
        <div ref={resultsRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 overscroll-contain">
          {searchResults.length === 0 ? (
            <p className="px-3 py-6 text-xs text-white/30 text-center">No results for &ldquo;{searchQuery}&rdquo;</p>
          ) : (
            <>
              <p className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/25">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} · ↑↓ to move · ↵ to open
              </p>
              {searchResults.map(({ leaf, parent }, idx) => (
                <Link
                  key={leaf.href}
                  href={leaf.href}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => { setSearchQuery(''); onClose?.(); }}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                    idx === activeIndex
                      ? 'bg-white/15 text-white font-semibold ring-1 ring-white/20'
                      : pathname === leaf.href
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                  }`}
                >
                  <leaf.icon className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{leaf.label}</div>
                    <div className="text-[9px] opacity-40 truncate">{parent}</div>
                  </div>
                  {idx === activeIndex && (
                    <span className="text-[9px] text-white/40 flex-shrink-0">↵</span>
                  )}
                </Link>
              ))}
            </>
          )}
        </div>
      ) : (
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 overscroll-contain">
          {NAV.map((item, i) =>
            isDivider(item) ? (
              <div key={`div-${i}`} className="pt-4 pb-1 px-1">
                <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {item.label}
                </p>
              </div>
            ) : isParent(item) ? (
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
      )}

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
