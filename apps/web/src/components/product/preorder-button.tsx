'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

/* A clean, normal Pre-Order button — emerald gradient, bilingual.
   Links straight to checkout with the preorder flag set. */
export function PreorderButton({
  productSlug,
  lang = 'en',
  className,
  full,
}: {
  productSlug: string;
  lang?: 'en' | 'bn';
  className?: string;
  full?: boolean;
}) {
  return (
    <Link
      href={`/checkout?productSlug=${productSlug}&qty=1&preorder=1`}
      onClick={e => e.stopPropagation()}
      className={cn(
        'flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-black text-white transition-all',
        'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600',
        'shadow-lg shadow-emerald-700/30 active:scale-95 ring-1 ring-white/10',
        full && 'w-full',
        className
      )}
    >
      <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{lang === 'bn' ? 'প্রি-অর্ডার' : 'PRE-ORDER'}</span>
    </Link>
  );
}

/* Small corner ribbon shown on the product image. */
export function PreorderTag({ lang = 'en', className }: { lang?: 'en' | 'bn'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm',
        className
      )}
    >
      <CalendarClock className="w-2.5 h-2.5" />
      {lang === 'bn' ? 'প্রি-অর্ডার' : 'Pre-Order'}
    </span>
  );
}
