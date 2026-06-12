'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, ShoppingBag, TrendingUp,
  Wallet, Settings, Store, ChevronRight, Plus, ArrowLeft,
  BarChart2, Package, RotateCcw, Star, Tag, Truck, Shield,
  Bell, LogOut, Zap, FileText, Palmtree,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type NavLeaf = { href: string; icon: React.ElementType; label: string; en: string; badge?: string };
type NavGroup = { group: string; items: NavLeaf[] };

const NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { href: '/seller/dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড', en: 'Dashboard' },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { href: '/seller/products',  icon: BookOpen,  label: 'আমার পণ্য',       en: 'My Products' },
      { href: '/seller/inventory', icon: Package,   label: 'ইনভেন্টরি',        en: 'Inventory' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { href: '/seller/orders',   icon: ShoppingBag, label: 'অর্ডারসমূহ',      en: 'Orders' },
      { href: '/seller/returns',  icon: RotateCcw,   label: 'রিটার্ন ও বিরোধ', en: 'Returns & Disputes' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { href: '/seller/analytics', icon: BarChart2,  label: 'বিক্রয় বিশ্লেষণ', en: 'Analytics' },
      { href: '/seller/reviews',   icon: Star,        label: 'কাস্টমার রিভিউ',   en: 'Reviews' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { href: '/seller/earnings',    icon: TrendingUp, label: 'আয়',       en: 'Earnings' },
      { href: '/seller/withdrawals', icon: Wallet,     label: 'উত্তোলন',  en: 'Withdrawals' },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { href: '/seller/promotions', icon: Zap,     label: 'প্রমোশন',     en: 'Promotions' },
      { href: '/seller/coupons',    icon: Tag,     label: 'কুপন কোড',    en: 'Coupons' },
    ],
  },
  {
    group: 'Store',
    items: [
      { href: '/seller/profile',   icon: Settings,  label: 'শপ সেটিংস',  en: 'Shop Settings' },
      { href: '/seller/shipping',  icon: Truck,     label: 'শিপিং',       en: 'Shipping' },
      { href: '/seller/policies',  icon: FileText,  label: 'পলিসি',       en: 'Policies' },
      { href: '/seller/vacation',  icon: Palmtree,  label: 'ভ্যাকেশন মোড', en: 'Vacation Mode' },
    ],
  },
];

const FLAT_NAV = NAV.flatMap(g => g.items);
const PUBLIC_PATHS = ['/seller/login', '/seller/register', '/seller/apply'];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isPublicPath && hydrated && !isAuthenticated) {
      router.push('/seller/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isPublicPath, hydrated, isAuthenticated, router, pathname]);

  if (isPublicPath) return <>{children}</>;

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'S';
  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100/80">

      {/* Top bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-sm shadow-primary/30">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <div className="font-black text-gray-900 text-sm tracking-tight">Seller Panel</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">UNKORA</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/seller/products/new"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all duration-150">
              <Plus className="w-3 h-3" /> নতুন পণ্য
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
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
            {/* Seller profile */}
            <div className="p-4 bg-gradient-to-br from-primary/5 to-emerald-50/50 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[10px] text-green-600 font-semibold">Active Seller</p>
                  </div>
                </div>
              </div>
              <Link href="/seller/products/new"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 transition-opacity shadow-sm shadow-primary/25">
                <Plus className="w-3.5 h-3.5" /> নতুন পণ্য যোগ করুন
              </Link>
            </div>

            {/* Grouped nav */}
            <div className="p-2 overflow-y-auto max-h-[calc(100vh-240px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map(({ group, items }) => (
                <div key={group} className="mb-0.5">
                  <p className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">{group}</p>
                  {items.map(item => {
                    const active = pathname.startsWith(item.href);
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
                        {item.badge && (
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600')}>
                            {item.badge}
                          </span>
                        )}
                        {active && <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sign out */}
            <div className="p-2 border-t border-gray-100">
              <button onClick={() => router.push('/')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> সাইন আউট
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile bottom tab nav */}
        <div className="md:hidden w-full mb-1 fixed bottom-0 left-0 right-0 z-30 px-2 pb-2">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-1 flex overflow-x-auto gap-0.5 shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FLAT_NAV.slice(0, 8).map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[9px] font-bold flex-shrink-0 transition-all',
                    active ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )}>
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{item.en.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
