'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, ShoppingBag, TrendingUp,
  Wallet, Settings, LogOut, Store, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/seller/dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড', en: 'Dashboard' },
  { href: '/seller/products', icon: BookOpen, label: 'আমার বই', en: 'My Books' },
  { href: '/seller/orders', icon: ShoppingBag, label: 'অর্ডারসমূহ', en: 'Orders' },
  { href: '/seller/earnings', icon: TrendingUp, label: 'আয়', en: 'Earnings' },
  { href: '/seller/withdrawals', icon: Wallet, label: 'উত্তোলন', en: 'Withdrawals' },
  { href: '/seller/profile', icon: Settings, label: 'শপ সেটিংস', en: 'Shop Settings' },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-sm">Seller Panel</span>
              <span className="text-gray-400 text-xs ml-1">— UNKORA</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              ← Shop
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user?.firstName?.[0]?.toUpperCase() ?? 'S'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm sticky top-20">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">স্বাগতম</p>
              <p className="font-bold text-gray-900 text-sm truncate">{user?.firstName} {user?.lastName}</p>
            </div>
            <nav className="p-2">
              {NAV_ITEMS.map(item => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-sm ${
                      active
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${active ? 'text-white/70' : 'text-gray-400'}`}>{item.en}</div>
                    </div>
                    {active && <ChevronRight className="w-3 h-3 opacity-70 flex-shrink-0" />}
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link href="/publish/submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary hover:bg-primary/5 transition-all font-semibold"
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>+ বই জমা দিন</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-1 flex overflow-x-auto gap-1 shadow-sm">
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
                    active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
