// Single source of truth for the admin sidebar navigation.
// Consumed by layout.tsx (sidebar) and command-palette.tsx (⌘K search / jump).
import {
  Activity, Archive, ArrowLeftRight, BarChart3, Bell as BellIcon, Bike, BookMarked,
  Bot, Brain, ClipboardList, Cpu, CreditCard, Database, DollarSign, Eye, FileCode2,
  FileText, Filter, Flag, FlaskConical, Gavel, Gift, GitBranch, Globe, ImageIcon,
  Layers, LayoutDashboard, LayoutGrid, LayoutList, Library, LifeBuoy, LineChart, Lock,
  Mail, Map, MapPin, Maximize2, Megaphone, MessageCircle, MessageSquare, Monitor,
  Package, Palette, Percent, PhoneCall, PieChart, Plus, Puzzle, Radio, Recycle, RefreshCw,
  Rocket, RotateCcw, ScrollText, Search, Settings, Share2, ShieldAlert, ShoppingBag,
  ShoppingCart, Sliders, Sparkles, Star, Store, Sun, Tag, Target, Ticket, TrendingUp,
  Truck, UserCog, Users, Users2, Wallet, Warehouse, Zap,
} from 'lucide-react';

export type NavLeaf = { href: string; label: string; icon: React.ElementType; exact?: boolean; keywords?: string[] };
export type NavParent = { label: string; icon: React.ElementType; children: NavLeaf[] };
export type NavDivider = { type: 'divider'; label: string };
export type NavItem = NavLeaf | NavParent | NavDivider;

export function isParent(item: NavItem): item is NavParent {
  return 'children' in item && !('type' in item);
}
export function isDivider(item: NavItem): item is NavDivider {
  return 'type' in item && item.type === 'divider';
}

export const NAV: NavItem[] = [
  /* ───── OVERVIEW ───── */
  { type: 'divider', label: 'OVERVIEW' },
  { href: '/admin',                label: 'Dashboard',      icon: LayoutDashboard, exact: true, keywords: ['home', 'overview', 'summary', 'kpi'] },
  { href: '/admin/control-center', label: 'Control Center', icon: LayoutGrid,                   keywords: ['command center', 'action queue', 'needs attention', 'pending', 'centralized', 'todo', 'tasks'] },
  { href: '/admin/reports',        label: 'Reports',        icon: BarChart3,                    keywords: ['report', 'analytics', 'metrics', 'kpi', 'sales report'] },

  /* ───── CATALOGUE ───── */
  { type: 'divider', label: 'CATALOGUE' },
  {
    label: 'Categories', icon: Tag,
    children: [
      { href: '/admin/categories',           label: 'All Categories', icon: Tag,        keywords: ['category', 'taxonomy', 'tree', 'department'] },
      { href: '/admin/categories/mega-menu', label: 'Mega Menu',      icon: LayoutList, keywords: ['navigation', 'menu', 'header', 'dropdown'] },
      { href: '/admin/categories/seo',       label: 'Category SEO',   icon: Search,     keywords: ['meta', 'seo', 'optimization'] },
    ],
  },
  {
    label: 'Products', icon: Package,
    children: [
      { href: '/admin/products',             label: 'All Products',    icon: Package,    keywords: ['catalog', 'item', 'sku', 'goods', 'merchandise'] },
      { href: '/admin/products/new',         label: 'Add New Product', icon: Plus,       keywords: ['create', 'add', 'new'] },
      { href: '/admin/products/setup',       label: 'Product Setup',   icon: Sliders,    keywords: ['config', 'configuration'] },
      { href: '/admin/products/brands',      label: 'Brands',          icon: Store,      keywords: ['manufacturer', 'maker'] },
      { href: '/admin/products/colors',      label: 'Colors',          icon: Palette,    keywords: ['variant', 'swatch'] },
      { href: '/admin/products/attributes',  label: 'Attributes',      icon: Sliders,    keywords: ['variant', 'option', 'spec'] },
      { href: '/admin/products/size-guides', label: 'Size Guides',     icon: LayoutList, keywords: ['sizing', 'measurement'] },
      { href: '/admin/products/warranties',  label: 'Warranties',      icon: ShieldAlert,keywords: ['guarantee'] },
      { href: '/admin/products/labels',      label: 'Product Labels',  icon: Tag,        keywords: ['badge', 'tag'] },
      { href: '/admin/products/analytics',   label: 'Product Analytics',icon: BarChart3, keywords: ['performance', 'best sellers', 'product stats'] },
    ],
  },
  { href: '/admin/auctions',  label: 'Auctions',  icon: Gavel,  keywords: ['bid', 'bidding'] },
  { href: '/admin/wholesale', label: 'Wholesale', icon: Layers, keywords: ['bulk', 'b2b', 'tier', 'pricing'] },
  {
    label: 'Inventory & Stock', icon: Archive,
    children: [
      { href: '/admin/inventory',                  label: 'Inventory Overview', icon: Archive,       keywords: ['stock', 'warehouse'] },
      { href: '/admin/inventory/stock-levels',     label: 'Stock Levels',       icon: Archive,       keywords: ['quantity', 'on hand'] },
      { href: '/admin/inventory/suppliers',        label: 'Suppliers',          icon: Store,         keywords: ['vendor', 'procurement', 'source'] },
      { href: '/admin/inventory/warehouses',       label: 'Warehouses',         icon: Layers,        keywords: ['location', 'storage'] },
      { href: '/admin/inventory/purchase-orders',  label: 'Purchase Orders',    icon: ClipboardList, keywords: ['po', 'procurement', 'restock', 'buy'] },
      { href: '/admin/inventory/stock-movements',  label: 'Stock Movements',    icon: RefreshCw,     keywords: ['transfer', 'log'] },
      { href: '/admin/inventory/adjustments',      label: 'Adjustments',        icon: Sliders,       keywords: ['correction', 'count'] },
      { href: '/admin/inventory/low-stock-alerts', label: 'Low Stock Alerts',   icon: ShieldAlert,   keywords: ['reorder', 'threshold'] },
    ],
  },

  /* ───── SALES ───── */
  { type: 'divider', label: 'SALES' },
  {
    label: 'Orders', icon: ShoppingBag,
    children: [
      { href: '/admin/orders',                 label: 'All Orders',       icon: ShoppingBag,   keywords: ['sales', 'purchase', 'invoice', 'transaction'] },
      { href: '/admin/orders/priority',        label: 'Order Priority',   icon: Flag,          keywords: ['urgent', 'priority', 'flag'] },
      { href: '/admin/orders/flow',            label: 'Order Flow',       icon: GitBranch,     keywords: ['workflow', 'automation', 'status flow'] },
      { href: '/admin/orders/batch',           label: 'Batch Processing', icon: Layers,        keywords: ['bulk', 'batch', 'mass update'] },
      { href: '/admin/orders/preorders',       label: 'Preorders',        icon: ClipboardList, keywords: ['advance', 'reserve'] },
      { href: '/admin/orders/preorder-config', label: 'Preorder Config',  icon: Sliders,       keywords: ['setup', 'preorder configuration'] },
      { href: '/admin/orders/preorder-orders', label: 'Preorder Orders',  icon: ShoppingBag,   keywords: ['preorder list'] },
      { href: '/admin/orders/auto-call',        label: 'Auto Call (IVR)',  icon: PhoneCall,     keywords: ['ivr', 'call', 'confirmation', 'phone', 'automated call'] },
      { href: '/admin/orders/exchanges',        label: 'Exchanges',        icon: ArrowLeftRight, keywords: ['exchange', 'swap', 'product change'] },
      { href: '/admin/orders/incomplete',       label: 'Incomplete Orders', icon: ShoppingCart,  keywords: ['abandoned', 'checkout', 'incomplete', 'recovery', 'cart', 'follow up'] },
    ],
  },
  {
    label: 'Returns & Refunds', icon: RotateCcw,
    children: [
      { href: '/admin/returns',                   label: 'Returns & Exchanges', icon: RefreshCw,  keywords: ['rma', 'exchange'] },
      { href: '/admin/refunds',                   label: 'Refunds',             icon: RotateCcw,  keywords: ['money back', 'reverse'] },
      { href: '/admin/orders/cod-reconciliation', label: 'COD Reconciliation',  icon: DollarSign, keywords: ['cash on delivery', 'collection'] },
    ],
  },
  { href: '/admin/fulfillment', label: 'Fulfillment Hub', icon: Warehouse, keywords: ['fulfillment', 'operations', 'multi-warehouse', 'courier engine', 'rto', 'ops', 'hub'] },
  {
    label: 'Shipping & Delivery', icon: Truck,
    children: [
      { href: '/admin/shipping/shipments',     label: 'Shipments',      icon: Truck,    keywords: ['fulfillment', 'tracking', 'dispatch'] },
      { href: '/admin/shipping/courier',       label: 'Courier',        icon: Truck,    keywords: ['logistics', 'carrier'] },
      { href: '/admin/shipping/courier-setup', label: 'Courier Setup',  icon: Settings, keywords: ['config', 'integration'] },
      { href: '/admin/shipping/zones',         label: 'Shipping Zones', icon: Map,      keywords: ['region', 'rate', 'area'] },
      { href: '/admin/shipping/pickup-points', label: 'Pickup Points',  icon: MapPin,   keywords: ['collection', 'location'] },
      { href: '/admin/shipping/delivery-boys', label: 'Delivery Boys',  icon: Bike,     keywords: ['rider', 'agent', 'driver'] },
      { href: '/admin/shipping/shiprocket',    label: 'Shiprocket',     icon: Rocket,   keywords: ['integration', 'logistics'] },
    ],
  },
  { href: '/admin/pos', label: 'POS Terminal', icon: Monitor, keywords: ['point of sale', 'cashier', 'retail', 'register'] },

  /* ───── MARKETPLACE ───── */
  { type: 'divider', label: 'MARKETPLACE' },
  {
    label: 'Marketplace', icon: Store,
    children: [
      { href: '/admin/sellers',              label: 'Sellers',             icon: Store,         keywords: ['vendor', 'marketplace', 'merchant'] },
      { href: '/admin/sellers/payouts',      label: 'Vendor Payouts',      icon: DollarSign,    keywords: ['payout', 'commission', 'earnings'] },
      { href: '/admin/sellers/commission',   label: 'Commission Rules',    icon: Percent,       keywords: ['rate', 'fee', 'commission'] },
      { href: '/admin/sellers/applications', label: 'Seller Applications', icon: ClipboardList, keywords: ['apply', 'onboard', 'registration'] },
    ],
  },

  /* ───── RECOMMERCE ───── */
  { type: 'divider', label: 'RECOMMERCE' },
  {
    label: 'Recommerce', icon: Recycle,
    children: [
      { href: '/admin/recommerce',          label: 'Overview',         icon: LayoutGrid, exact: true, keywords: ['salvage yard', 'resale', 'used', 'refurbished', 'second hand', 'recommerce'] },
      { href: '/admin/recommerce/listings', label: 'Listings',         icon: Package,    keywords: ['ads', 'items', 'moderation', 'approve', 'reject', 'used product'] },
      { href: '/admin/recommerce/sellers',  label: 'Sellers',          icon: Users,      keywords: ['resellers', 'vendors', 'verify', 'kyc'] },
      { href: '/admin/recommerce/grading',  label: 'Grading Criteria', icon: Tag,        keywords: ['condition', 'grade', 'quality', 'a+ a b c', 'inspection'] },
      { href: '/recommerce',                label: 'View Salvage Yard', icon: Store,     keywords: ['storefront', 'live site', 'recommerce site'] },
    ],
  },

  /* ───── PROMOTIONS ───── */
  { type: 'divider', label: 'PROMOTIONS' },
  {
    label: 'Promotions', icon: Zap,
    children: [
      { href: '/admin/promotions/flash-deals',     label: 'Flash Deals',     icon: Zap,        keywords: ['discount', 'offer', 'sale', 'limited time'] },
      { href: '/admin/promotions/deal-of-the-day', label: 'Deal of the Day', icon: Sun,        keywords: ['daily', 'offer', 'discount'] },
      { href: '/admin/promotions/coupons',         label: 'Coupons',         icon: Ticket,     keywords: ['voucher', 'promo code', 'discount'] },
      { href: '/admin/promotions/combo-offers',    label: 'Combo Offers',    icon: Package,    keywords: ['bundle', 'combo', 'set', 'package deal'] },
      { href: '/admin/promotions',                 label: 'All Promotions',  icon: Zap,        keywords: ['campaign', 'discount', 'offer'] },
      { href: '/admin/pos/gift-cards',             label: 'Gift Cards',      icon: CreditCard, keywords: ['voucher', 'prepaid', 'gift'] },
    ],
  },

  /* ───── CUSTOMERS ───── */
  { type: 'divider', label: 'CUSTOMERS' },
  {
    label: 'Customers', icon: Users,
    children: [
      { href: '/admin/customers',                label: 'All Customers',   icon: Users,         keywords: ['user', 'buyer', 'account', 'member'] },
      { href: '/admin/customers/segments',       label: 'Segments',        icon: Users2,        keywords: ['group', 'cohort', 'audience'] },
      { href: '/admin/customers/journey',        label: 'Journey Mapping', icon: Map,           keywords: ['customer journey', 'touchpoints', 'lifecycle'] },
      { href: '/admin/customers/communications', label: 'Communications',  icon: MessageSquare, keywords: ['sms history', 'email history', 'messages'] },
      { href: '/admin/customers/reviews',        label: 'Reviews',         icon: MessageSquare, keywords: ['rating', 'feedback', 'comment'] },
      { href: '/admin/customers/club-points',    label: 'Club Points',     icon: Star,          keywords: ['loyalty', 'rewards', 'points'] },
      { href: '/admin/customers/referrals',      label: 'Referrals',       icon: Share2,        keywords: ['invite', 'refer'] },
      { href: '/admin/customers/fraud-detection',label: 'Fraud Detection', icon: ShieldAlert,   keywords: ['risk', 'security', 'suspicious'] },
      { href: '/admin/customers/block-list',     label: 'Block List',      icon: ShieldAlert,   keywords: ['block', 'ban', 'blacklist', 'phone block', 'ip block', 'ghost block'] },
    ],
  },

  /* ───── SUPPORT ───── */
  { type: 'divider', label: 'SUPPORT' },
  {
    label: 'Support', icon: LifeBuoy,
    children: [
      { href: '/admin/customers/support',            label: 'Support Tickets',    icon: LifeBuoy,      keywords: ['help', 'desk', 'complaint', 'ticket'] },
      { href: '/admin/customers/support-automation', label: 'Support Automation', icon: Bot,           keywords: ['auto reply', 'chatbot', 'routing'] },
      { href: '/admin/settings/chat-widget',         label: 'Chat Widget',        icon: MessageCircle, keywords: ['chatbot', 'unkora ai', 'whatsapp', 'messenger', 'contact', 'widget'] },
    ],
  },

  /* ───── MARKETING ───── */
  { type: 'divider', label: 'MARKETING' },
  {
    label: 'Marketing', icon: Megaphone,
    children: [
      { href: '/admin/marketing/campaigns',  label: 'Campaigns',          icon: Megaphone,     keywords: ['campaign', 'marketing', 'broadcast'] },
      { href: '/admin/marketing/email',      label: 'Email Campaigns',    icon: Mail,          keywords: ['newsletter', 'broadcast', 'email'] },
      { href: '/admin/marketing/sms',        label: 'SMS',                icon: MessageCircle, keywords: ['text', 'message', 'sms'] },
      { href: '/admin/marketing/push',       label: 'Push Notifications', icon: BellIcon,      keywords: ['alert', 'web push', 'notification'] },
      { href: '/admin/marketing/popups',     label: 'Popups',             icon: Maximize2,     keywords: ['modal', 'banner', 'popup'] },
      { href: '/admin/marketing/smart-bar',  label: 'Smart Bar',          icon: Megaphone,     keywords: ['announcement', 'banner', 'bar'] },
      { href: '/admin/marketing/ab-testing',     label: 'A/B Testing',        icon: FlaskConical,   keywords: ['split test', 'experiment', 'ab test'] },
      { href: '/admin/marketing/affiliates',     label: 'Affiliates',         icon: Share2,         keywords: ['partner', 'commission', 'affiliate'] },
      { href: '/admin/marketing/whatsapp',       label: 'WhatsApp Marketing', icon: MessageCircle,  keywords: ['whatsapp', 'campaign', 'broadcast', 'wa'] },
      { href: '/admin/marketing/cart-recovery',  label: 'Cart Recovery',      icon: ShoppingCart,   keywords: ['abandoned cart', 'recovery', 'cart', 'reminder'] },
      { href: '/admin/classifieds',              label: 'Classifieds',        icon: LayoutList,     keywords: ['listing', 'ads', 'classified'] },
    ],
  },

  /* ───── ANALYTICS ───── */
  { type: 'divider', label: 'ANALYTICS' },
  {
    label: 'Analytics', icon: TrendingUp,
    children: [
      { href: '/admin/analytics',                label: 'Analytics Hub',     icon: TrendingUp, keywords: ['stats', 'metrics', 'insights'] },
      { href: '/admin/advanced-reports/pivot',   label: 'Report Builder',    icon: LayoutGrid, keywords: ['pivot', 'breakdown', 'custom report', 'region', 'fb ads manager'] },
      { href: '/admin/analytics/live-traffic',   label: 'Live Traffic',      icon: Activity,   keywords: ['realtime', 'visitors', 'live', 'monitor'] },
      { href: '/admin/analytics/heatmap',        label: 'Heatmap Analysis',  icon: LayoutGrid, keywords: ['click map', 'scroll', 'user behavior'] },
      { href: '/admin/analytics/conversion',     label: 'Conversion Funnel', icon: Filter,     keywords: ['funnel', 'drop off', 'checkout'] },
      { href: '/admin/analytics/behavioral',     label: 'Behavioral',        icon: Eye,        keywords: ['session', 'navigation', 'flow', 'behavior'] },
      { href: '/admin/analytics/ltv',            label: 'Customer LTV',      icon: DollarSign, keywords: ['lifetime value', 'cohort', 'retention'] },
      { href: '/admin/predictions',              label: 'AI Predictions',    icon: Brain,      keywords: ['forecast', 'ai', 'sales prediction', 'machine learning'] },
      { href: '/admin/analytics/widgets',        label: 'Dashboard Widgets', icon: LayoutGrid, keywords: ['widget', 'customize', 'dashboard'] },
      { href: '/admin/analytics/meta-pixel',     label: 'Meta Pixel',        icon: Target,     keywords: ['facebook', 'capi', 'tracking'] },
      { href: '/admin/analytics/google',         label: 'Google Analytics',  icon: BarChart3,  keywords: ['ga4', 'tracking'] },
      { href: '/admin/analytics/tag-manager',    label: 'Tag Manager',       icon: Tag,        keywords: ['gtm', 'tracking'] },
      { href: '/admin/analytics/search-console', label: 'Search Console',    icon: Globe,      keywords: ['gsc', 'indexing'] },
    ],
  },

  /* ───── SALES CHANNELS ───── */
  { type: 'divider', label: 'SALES CHANNELS' },
  {
    label: 'Sales Channels', icon: Share2,
    children: [
      { href: '/admin/channels/facebook',        label: 'Facebook',        icon: Share2,        keywords: ['social', 'fb', 'shop'] },
      { href: '/admin/channels/instagram',       label: 'Instagram',       icon: Star,          keywords: ['social', 'ig', 'shop'] },
      { href: '/admin/channels/google-shopping', label: 'Google Shopping', icon: Globe,         keywords: ['merchant', 'feed', 'google'] },
      { href: '/admin/channels/whatsapp',        label: 'WhatsApp',        icon: MessageCircle, keywords: ['social', 'chat', 'whatsapp'] },
      { href: '/admin/channels/live-commerce',   label: 'Live Commerce',   icon: Radio,         keywords: ['stream', 'broadcast', 'live'] },
    ],
  },

  /* ───── CONTENT ───── */
  { type: 'divider', label: 'CONTENT' },
  {
    label: 'Content', icon: FileText,
    children: [
      { href: '/admin/content/pages',          label: 'Static Pages',      icon: FileCode2,  keywords: ['about', 'contact', 'privacy', 'terms', 'faq', 'page', 'cms'] },
      { href: '/admin/content/banners',        label: 'Banners & Sliders', icon: ImageIcon,  keywords: ['hero', 'carousel', 'slideshow', 'ad slider'] },
      { href: '/admin/content/blog',           label: 'Blog',              icon: FileText,   keywords: ['article', 'post', 'news'] },
      { href: '/admin/content/blog/new',       label: 'New Post',          icon: Plus,       keywords: ['write', 'article', 'new post'] },
      { href: '/admin/content/book-submissions',label: 'Book Submissions',  icon: BookMarked, keywords: ['author', 'manuscript', 'book'] },
    ],
  },

  /* ───── SEO & VISIBILITY ───── */
  { type: 'divider', label: 'SEO & VISIBILITY' },
  {
    label: 'SEO Tools', icon: Search,
    children: [
      { href: '/admin/seo',                 label: 'SEO Overview',      icon: Search,    keywords: ['optimization', 'ranking'] },
      { href: '/admin/seo/global',          label: 'Global Settings',   icon: Settings,  keywords: ['meta', 'config', 'seo settings'] },
      { href: '/admin/seo/sitemap',         label: 'Sitemap',           icon: Globe,     keywords: ['xml', 'index'] },
      { href: '/admin/seo/robots',          label: 'Robots.txt',        icon: FileText,  keywords: ['crawl', 'index'] },
      { href: '/admin/seo/redirects',       label: 'Redirects',         icon: RotateCcw, keywords: ['301', 'url'] },
      { href: '/admin/seo/aeo',             label: 'AEO',               icon: Bot,       keywords: ['answer engine', 'ai'] },
      { href: '/admin/seo/geo',             label: 'GEO',               icon: Globe,     keywords: ['generative engine', 'ai'] },
      { href: '/admin/seo/aio',             label: 'AI Overview (AIO)', icon: Bot,       keywords: ['ai overview', 'sge'] },
      { href: '/admin/seo/advanced-search', label: 'Advanced Search',   icon: Search,    keywords: ['site search', 'index'] },
    ],
  },

  /* ───── AI & INTELLIGENCE ───── */
  { type: 'divider', label: 'AI & INTELLIGENCE' },
  {
    label: 'AI & Intelligence', icon: Sparkles,
    children: [
      { href: '/admin/ai-studio',               label: 'AI Studio',          icon: Sparkles,      keywords: ['artificial intelligence', 'gpt', 'ai automation'] },
      { href: '/admin/ai-studio/orchestrator',  label: 'Orchestrator',       icon: Cpu,           keywords: ['workflow', 'automation'] },
      { href: '/admin/ai-studio/agents',        label: 'Agents',             icon: Bot,           keywords: ['assistant', 'bot'] },
      { href: '/admin/ai-studio/n8n',           label: 'n8n Automation',     icon: Puzzle,        keywords: ['n8n', 'webhook', 'workflow', 'automation', 'integration'] },
      { href: '/admin/ai-studio/providers',     label: 'Providers',          icon: Zap,           keywords: ['openai', 'anthropic', 'model'] },
      { href: '/admin/ai-studio/library',       label: 'Prompt Library',     icon: Library,       keywords: ['template', 'prompt'] },
      { href: '/admin/ai-studio/logs',          label: 'AI Logs',            icon: ScrollText, keywords: ['history', 'usage'] },
      { href: '/admin/settings/virtual-trial',  label: 'Virtual Trial Room', icon: Monitor,    keywords: ['trial room', 'try on', 'virtual', 'ar'] },
    ],
  },

  /* ───── FINANCE ───── */
  { type: 'divider', label: 'FINANCE' },
  {
    label: 'Finance', icon: Wallet,
    children: [
      { href: '/admin/finance/gateways',     label: 'Payment Gateways', icon: CreditCard, keywords: ['bkash', 'nagad', 'stripe', 'gateway'] },
      { href: '/admin/finance/transactions', label: 'Transactions',     icon: DollarSign, keywords: ['payment', 'ledger'] },
      { href: '/admin/finance/tax',          label: 'Tax Settings',     icon: Percent,    keywords: ['vat', 'gst'] },
      { href: '/admin/finance/pnl',          label: 'P&L Report',       icon: LineChart,  keywords: ['profit', 'loss', 'income'] },
      { href: '/admin/finance/wallet',       label: 'Digital Wallet',   icon: Wallet,     keywords: ['balance', 'credit'] },
      { href: '/admin/finance/store-credit', label: 'Store Credit',     icon: Gift,       keywords: ['credit', 'refund'] },
      { href: '/admin/advanced-reports',     label: 'Advanced Reports', icon: PieChart,   keywords: ['analytics', 'export', 'report'] },
    ],
  },

  /* ───── SYSTEM ───── */
  { type: 'divider', label: 'SYSTEM' },
  {
    label: 'System', icon: Settings,
    children: [
      { href: '/admin/settings',          label: 'Settings',            icon: Settings,   keywords: ['config', 'general', 'preferences'] },
      { href: '/admin/design',            label: 'Design Studio',       icon: Palette,    keywords: ['theme', 'appearance', 'brand'] },
      { href: '/admin/localization',      label: 'Multi-Currency/Lang', icon: Globe,      keywords: ['language', 'currency', 'translation', 'i18n'] },
      { href: '/admin/employees',         label: 'Employee Management', icon: Users,      keywords: ['employee', 'staff', 'performance', 'team', 'kpi', 'targets'] },
      { href: '/admin/staff',             label: 'Staff & Permissions', icon: UserCog,    keywords: ['team', 'employee', 'role'] },
      { href: '/admin/rbac',              label: 'RBAC',                icon: Lock,       keywords: ['role', 'access control', 'permission'] },
      { href: '/admin/addons',            label: 'Addon Manager',       icon: Puzzle,     keywords: ['plugin', 'extension', 'module'] },
      { href: '/admin/audit-logs',        label: 'Audit Logs',          icon: Database,   keywords: ['activity', 'history', 'log'] },
      { href: '/admin/settings/fraud-guard', label: 'Fraud Guard Rules', icon: ShieldAlert, keywords: ['fraud', 'guard', 'rules', 'risk engine', 'auto block'] },
      { href: '/admin/integrations',      label: 'Integrations & API', icon: Globe,      keywords: ['api', 'key', 'webhook', 'integration', 'sdk', 'third party'] },
    ],
  },
];

// Flattened list of all leaf pages — handy for command palette / global search.
export const NAV_LEAVES: (NavLeaf & { section: string })[] = (() => {
  const out: (NavLeaf & { section: string })[] = [];
  let section = '';
  for (const item of NAV) {
    if (isDivider(item)) { section = item.label; continue; }
    if (isParent(item)) {
      for (const child of item.children) out.push({ ...child, section });
    } else {
      out.push({ ...item, section });
    }
  }
  return out;
})();
