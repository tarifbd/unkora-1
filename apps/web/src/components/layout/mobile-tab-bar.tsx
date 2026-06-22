'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
   Premium mobile-first bottom tab bar (app-store style)
   - Fixed bottom, safe-area aware, backdrop blur, active pill
   - Up to 5 primary tabs; optional "More" bottom sheet for overflow
   Reused across shop / account / seller / admin surfaces.
──────────────────────────────────────────────────────────────── */

export type TabItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  exact?: boolean;
  badge?: number | string;
};

export type TabGroup = { group: string; items: TabItem[] };

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href);
}

export function MobileTabBar({
  primary,
  groups,
  sheetTitle = 'সব মেনু',
  footer,
}: {
  primary: TabItem[];
  groups?: TabGroup[];
  sheetTitle?: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close the sheet whenever the route changes
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const hasMore = !!groups && groups.length > 0;
  const moreActive = hasMore && groups!.some(g => g.items.some(i => isActive(pathname, i.href, i.exact)))
    && !primary.some(p => isActive(pathname, p.href, p.exact));

  return (
    <>
      {/* ── Bottom bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200/80 bg-white/90 backdrop-blur-xl shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.18)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch justify-around px-1.5 pt-1.5 pb-1">
          {primary.map(item => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="group relative flex flex-1 flex-col items-center gap-1 py-1 min-w-0"
              >
                <span className={cn(
                  'relative flex items-center justify-center rounded-2xl transition-all duration-200',
                  active ? 'h-9 w-12 bg-primary/12' : 'h-9 w-11'
                )}>
                  <Icon className={cn(
                    'w-[22px] h-[22px] transition-all duration-200',
                    active ? 'text-primary scale-105' : 'text-gray-400 group-active:scale-90'
                  )} />
                  {item.badge != null && Number(item.badge) !== 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                      {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className={cn(
                  'text-[10px] font-bold leading-none truncate max-w-full transition-colors',
                  active ? 'text-primary' : 'text-gray-500'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {hasMore && (
            <button onClick={() => setSheetOpen(true)}
              className="group relative flex flex-1 flex-col items-center gap-1 py-1 min-w-0"
            >
              <span className={cn(
                'relative flex items-center justify-center rounded-2xl transition-all duration-200 h-9',
                moreActive ? 'w-12 bg-primary/12' : 'w-11'
              )}>
                <MoreHorizontal className={cn('w-[22px] h-[22px] transition-colors', moreActive ? 'text-primary' : 'text-gray-400')} />
              </span>
              <span className={cn('text-[10px] font-bold leading-none', moreActive ? 'text-primary' : 'text-gray-500')}>
                আরও
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── More bottom sheet ── */}
      {hasMore && (
        <div className={cn('md:hidden fixed inset-0 z-50 transition-opacity duration-300', sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div
            className={cn(
              'absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl max-h-[82vh] flex flex-col transition-transform duration-300 ease-out',
              sheetOpen ? 'translate-y-0' : 'translate-y-full'
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 pt-2.5 pb-1">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="font-black text-gray-900 text-base">{sheetTitle}</h3>
              <button onClick={() => setSheetOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Grouped items */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 overscroll-contain">
              {groups!.map(({ group, items }) => (
                <div key={group} className="mb-1">
                  <p className="px-3 pt-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{group}</p>
                  <div className="grid grid-cols-1 gap-0.5">
                    {items.map(item => {
                      const active = isActive(pathname, item.href, item.exact);
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors active:scale-[0.98]',
                            active ? 'bg-primary/10' : 'hover:bg-gray-50'
                          )}>
                          <span className={cn('flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0',
                            active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500')}>
                            <Icon className="w-[18px] h-[18px]" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-bold truncate', active ? 'text-primary' : 'text-gray-800')}>{item.label}</p>
                            {item.sublabel && <p className="text-[11px] text-gray-400 truncate leading-tight">{item.sublabel}</p>}
                          </div>
                          {item.badge != null && Number(item.badge) !== 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              {footer && <div className="px-1 pt-2">{footer}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
