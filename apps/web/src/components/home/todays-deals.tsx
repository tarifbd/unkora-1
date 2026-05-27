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
    <section className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center"><Zap className="h-5 w-5 text-white fill-white" /></div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Today's Deals</h2>
            <p className="text-sm text-gray-500">Limited time offers</p>
          </div>
        </div>
        {sectionEnd && <CountdownTimer endDate={sectionEnd} size="sm" label="Sale ends in" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <Link key={deal.id} href={`/products/${product.slug}`} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                {product.images?.[0] ? (
                  <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                )}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{discount}</div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">{product.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-orange-600">৳{Math.round(salePrice).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString()}</span>
                </div>
                <CountdownTimer endDate={deal.endDate} size="sm" label="" className="mt-2" />
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
