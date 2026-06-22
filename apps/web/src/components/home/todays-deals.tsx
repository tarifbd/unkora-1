'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { ShoppingCart, Zap } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export function TodaysDeals() {
  const { data } = useQuery({
    queryKey: ['flash-deals-active'],
    queryFn: () => fetch(`${API}/flash-deals/active`).then(r => r.json()),
    select: r => r.data ?? r,
    staleTime: 30 * 1000,
  });

  const deals = Array.isArray(data) ? data.slice(0, 6) : [];
  if (!deals.length) return null;

  // Use the first deal's end time for the section countdown
  const sectionEnd = deals[0]?.endDate;

  return (
    <section className="py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-white" /></div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">Today's Deals</h2>
            <p className="text-xs sm:text-sm text-gray-500">Limited time offers</p>
          </div>
        </div>
        {sectionEnd && <CountdownTimer endDate={sectionEnd} size="sm" label="Sale ends in" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {deals.map((deal: any) => {
          const product = deal.product;
          if (!product) return null;
          const discount = deal.discountType === 'PERCENTAGE'
            ? `${deal.discountValue}% OFF`
            : `৳${deal.discountValue} OFF`;
          const salePrice = deal.discountType === 'PERCENTAGE'
            ? Number(product.basePrice) * (1 - deal.discountValue / 100)
            : Number(product.basePrice) - deal.discountValue;

          return (
            <Link key={deal.id} href={`/products/${product.slug}`} className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                {product.images?.[0] ? (
                  <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 220px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                )}
                <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full">{discount}</div>
              </div>
              <div className="p-2 sm:p-3">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1.5 sm:mb-2">{product.name}</p>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-orange-600">৳{Math.round(salePrice).toLocaleString()}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString()}</span>
                </div>
                <CountdownTimer endDate={deal.endDate} size="sm" label="" className="mt-1.5 sm:mt-2" />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="text-center mt-4">
        <Link href="/flash-deals" className="text-sm font-semibold text-orange-600 hover:underline">View All Deals →</Link>
      </div>
    </section>
  );
}
