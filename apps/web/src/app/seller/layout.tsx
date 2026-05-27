'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, ShoppingBag, TrendingUp,
  Wallet, Settings, Store, ChevronRight, Plus, ArrowLeft,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const NAV_ITEMS = [
  { href: '/seller/dashboard',   icon: LayoutDashboard, label: 'ড্যাশবোর্ড',  en: 'Dashboard' },
  { href: '/seller/products',    icon: BookOpen,         label: 'আমার বই',     en: 'My Books' },
  { href: '/seller/orders',      icon: ShoppingBag,      label: 'অর্ডারসমূহ',  en: 'Orders' },
  { href: '/seller/earnings',    icon: TrendingUp,       label: 'আয়',          en: 'Earnings' },
  { href: '/seller/withdrawals', icon: Wallet,           label: 'উত্তোলন',     en: 'Withdrawals' },
  { href: '/seller/profile',     icon: Settings,         label: 'শপ সেটিংস',  en: 'Shop Settings' },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + pathname);
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-gray-50/80">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <div className="font-black text-gray-900 text-sm tracking-tight">Seller Panel</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">UNKORA</div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/publish/submit"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all duration-150"
            >
              <Plus className="w-3 h-3" />
              বই জমা দিন
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Shop</span>
            </Link>
            <div
              title={`${user?.firstName} ${user?.lastName}`}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-default"
            >
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex gap-5 lg:gap-7">

        {/* Desktop Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm sticky top-20">
            {/* User info */}
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-2 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm group ${
                      active
                        ? 'bg-primary text-white shadow-sm shadow-primary/25'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-[13px]">{item.label}</div>
                      <div className={`text-[10px] truncate leading-tight ${active ? 'text-white/60' : 'text-gray-400'}`}>{item.en}</div>
                    </div>
                    {active && <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />}
                  </Link>
                );
              })}
            </nav>

            {/* Submit book CTA */}
            <div className="p-2 pt-0">
              <Link
                href="/publish/submit"
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 transition-all shadow-sm shadow-primary/25 hover:shadow-primary/40"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন বই জমা দিন
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile tab nav */}
        <div className="md:hidden w-full mb-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-1 flex overflow-x-auto gap-0.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl text-[10px] font-bold flex-shrink-0 transition-all ${
                    active ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
}
