'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, Heart, MapPin, User, LogOut,
  ChevronRight, ShoppingBag, CalendarClock, Search, ArrowLeft, BookOpen,
  CreditCard, Tag, Wallet, Star, RotateCcw, Bell, Shield,
  Users, LifeBuoy, Eye, Gift, Sparkles, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileTabBar, type TabGroup } from '@/components/layout/mobile-tab-bar';

type NavLeaf = { href: string; icon: React.ElementType; label: string; en: string; exact?: boolean; badge?: string };
type NavGroup = { group: string; items: NavLeaf[] };

const NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { href: '/account', icon: LayoutDashboard, label: 'ড্যাশবোর্ড', en: 'Dashboard', exact: true },
    ],
  },
  {
    group: 'Shopping',
    items: [
      { href: '/account/orders',          icon: Package,       label: 'আমার অর্ডার',      en: 'My Orders' },
      { href: '/account/returns',         icon: RotateCcw,     label: 'রিটার্ন ও রিফান্ড', en: 'Returns & Refunds' },
      { href: '/account/preorders',       icon: CalendarClock, label: 'প্রি-অর্ডার',        en: 'Pre-orders' },
      { href: '/account/my-books',        icon: BookOpen,      label: 'আমার বই',            en: 'My Books' },
      { href: '/account/wishlist',        icon: Heart,         label: 'উইশলিস্ট',           en: 'Wishlist' },
      { href: '/account/recently-viewed', icon: Eye,           label: 'সাম্প্রতিক দেখা',   en: 'Recently Viewed' },
    ],
  },
  {
    group: 'Wallet & Rewards',
    items: [
      { href: '/account/wallet',          icon: Wallet,   label: 'আমার ওয়ালেট',  en: 'My Wallet' },
      { href: '/account/points',          icon: Star,     label: 'ক্লাব পয়েন্ট',  en: 'Club Points' },
      { href: '/account/coupons',         icon: Tag,      label: 'কুপন',             en: 'Coupons' },
      { href: '/account/referrals',       icon: Gift,     label: 'রেফারেল',          en: 'Referrals' },
    ],
  },
  {
    group: 'Account',
    items: [
      { href: '/account/profile',         icon: User,      label: 'প্রোফাইল',          en: 'Profile' },
      { href: '/account/security',        icon: Shield,    label: 'নিরাপত্তা',          en: 'Security' },
      { href: '/account/addresses',       icon: MapPin,    label: 'ঠিকানা',            en: 'Addresses' },
      { href: '/account/payment',         icon: CreditCard,label: 'পেমেন্ট মেথড',      en: 'Payment Methods' },
      { href: '/account/notifications',   icon: Bell,      label: 'নোটিফিকেশন',        en: 'Notifications' },
      { href: '/account/reviews',         icon: Sparkles,  label: 'আমার রিভিউ',        en: 'My Reviews' },
    ],
  },
  {
    group: 'Support',
    items: [
      { href: '/account/support', icon: LifeBuoy, label: 'সাহায্য ও সাপোর্ট', en: 'Help & Support' },
    ],
  },
];

/* Premium mobile bottom nav config */
const MOBILE_PRIMARY = [
  { href: '/account',          icon: LayoutDashboard, label: 'হোম', exact: true },
  { href: '/account/orders',   icon: Package,         label: 'অর্ডার' },
  { href: '/account/wallet',   icon: Wallet,          label: 'ওয়ালেট' },
  { href: '/account/wishlist', icon: Heart,           label: 'উইশলিস্ট' },
];
const MOBILE_GROUPS: TabGroup[] = NAV.map(g => ({
  group: g.group,
  items: g.items.map(i => ({ href: i.href, icon: i.icon, label: i.label, sublabel: i.en, exact: i.exact })),
}));

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/login?redirect=' + pathname);
  }, [hydrated, isAuthenticated, router, pathname]);

  if (!hydrated || !isAuthenticated) return null;

  const initials = (
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
    user?.name?.[0]?.toUpperCase() || 'U'
  );
  const displayName = user?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const toggleGroup = (g: string) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/80">

      {/* Top bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <div className="font-black text-gray-900 text-sm tracking-tight">আমার অ্যাকাউন্ট</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">UNKORA</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/track-order"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all duration-150">
              <Search className="w-3 h-3" /> অর্ডার ট্র্যাক
            </Link>
            <Link href="/account/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Link>
            <Link href="/" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-3 h-3" /><span className="hidden sm:inline">Shop</span>
            </Link>
            <div title={displayName}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-default">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex gap-5 lg:gap-7">

        {/* Desktop Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm sticky top-20">
            {/* User info + quick stats */}
            <div className="p-4 bg-gradient-to-br from-primary/5 to-emerald-50/50 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account/wallet" className="bg-white/80 rounded-xl p-2 text-center hover:bg-white transition-colors border border-gray-100/80">
                  <p className="text-[10px] text-gray-400">ওয়ালেট</p>
                  <p className="text-xs font-black text-gray-900">৳০</p>
                </Link>
                <Link href="/account/points" className="bg-white/80 rounded-xl p-2 text-center hover:bg-white transition-colors border border-gray-100/80">
                  <p className="text-[10px] text-gray-400">পয়েন্ট</p>
                  <p className="text-xs font-black text-amber-600">০ pts</p>
                </Link>
              </div>
            </div>

            {/* Grouped nav */}
            <div className="p-2 overflow-y-auto max-h-[calc(100vh-280px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map(({ group, items }) => (
                <div key={group} className="mb-0.5">
                  <p className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">{group}</p>
                  {items.map(item => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm group',
                          active ? 'bg-primary text-white shadow-sm shadow-primary/25' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}>
                        <item.icon className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:scale-110', active ? 'text-white' : 'text-gray-400')} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-[12px]">{item.label}</div>
                          <div className={cn('text-[10px] truncate leading-tight', active ? 'text-white/60' : 'text-gray-400')}>{item.en}</div>
                        </div>
                        {active && <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 space-y-0.5">
              <Link href="/track-order"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                <Search className="w-3.5 h-3.5" /> অর্ডার ট্র্যাক করুন
              </Link>
              <button onClick={() => { clearAuth(); router.push('/'); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> সাইন আউট
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Premium mobile bottom nav */}
      <MobileTabBar
        primary={MOBILE_PRIMARY}
        groups={MOBILE_GROUPS}
        sheetTitle="আমার অ্যাকাউন্ট"
        footer={
          <div className="space-y-1 pt-1 border-t border-gray-100 mt-1">
            <Link href="/track-order"
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex-shrink-0">
                <Search className="w-[18px] h-[18px]" />
              </span>
              অর্ডার ট্র্যাক করুন
            </Link>
            <button onClick={() => { clearAuth(); router.push('/'); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-500 flex-shrink-0">
                <LogOut className="w-[18px] h-[18px]" />
              </span>
              সাইন আউট
            </button>
          </div>
        }
      />
    </div>
  );
}
