'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/',           icon: Home,          label: 'হোম',      exact: true },
  { href: '/categories', icon: LayoutGrid,    label: 'ক্যাটাগরি' },
  null, // center FAB slot
  { href: '/support',    icon: MessageCircle, label: 'মেসেজ' },
  { href: '/account',    icon: User,          label: 'অ্যাকাউন্ট' },
] as const;

export function ShopBottomNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* blurred glass background */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" />

      <div className="relative flex items-end h-16">
        {TABS.map((tab, i) => {
          if (tab === null) {
            /* ── Center FAB: Search ── */
            return (
              <div key="fab" className="flex-1 flex flex-col items-center">
                <Link
                  href="/search"
                  className={cn(
                    'relative -top-4 flex items-center justify-center',
                    'w-14 h-14 rounded-full shadow-lg',
                    'bg-gradient-to-br from-primary to-secondary',
                    'text-white transition-transform active:scale-95',
                  )}
                  aria-label="সার্চ"
                >
                  <Search className="w-6 h-6" />
                </Link>
                <span className="text-[10px] text-gray-500 -mt-1 mb-1.5 font-medium">সার্চ</span>
              </div>
            );
          }

          const active = isActive(tab.href, 'exact' in tab ? tab.exact : false);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-end pb-2 pt-1 gap-0.5 group"
            >
              <span
                className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary scale-110'
                    : 'text-gray-400 group-hover:text-gray-600',
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.2px]')} />
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-gray-400',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
