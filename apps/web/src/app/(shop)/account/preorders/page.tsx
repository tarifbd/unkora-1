'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Package, CheckCircle2, Clock, Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function MyPreordersPage() {
  const { isAuthenticated, token } = useAuthStore() as any;
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login?redirect=/account/preorders');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-preorders'],
    queryFn: () => fetch(`${API}/preorders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    enabled: !!isAuthenticated,
    select: r => r.data ?? [],
  });

  const items: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
          <CalendarClock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Pre-orders</h1>
          <p className="text-sm text-gray-500">আপনার প্রি-অর্ডার করা পণ্যগুলো</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-10 w-10 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">কোনো প্রি-অর্ডার নেই</h3>
          <p className="text-sm text-gray-400 mb-6">আপনি এখনো কোনো পণ্য প্রি-অর্ডার করেননি।</p>
          <Link href="/products" className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
            পণ্য দেখুন
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item: any) => {
          const product = item.preorder?.product;
          const preorder = item.preorder;
          const img = product?.images?.[0]?.url;
          const price = Number(product?.salePrice ?? product?.basePrice ?? 0);
          const prepayAmt = Math.ceil(price * (preorder?.prepaymentPct ?? 30) / 100);
          const expectedDate = preorder?.expectedDelivery ? new Date(preorder.expectedDelivery) : null;
          const isDelivered = item.finalPaid;
          const isPrepaid = item.prepaymentPaid;

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
                  {img ? (
                    <Image src={img} alt={product?.name ?? ''} fill className="object-cover" unoptimized={img.includes('unsplash')} sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product?.slug ?? ''}`} className="font-bold text-gray-900 hover:text-violet-600 transition-colors line-clamp-2 text-sm">
                    {product?.name}
                  </Link>

                  {/* Payment status pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPrepaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isPrepaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {isPrepaid ? 'Prepayment Done' : `Prepayment: ৳${prepayAmt.toLocaleString('en-BD')}`}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isDelivered ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isDelivered ? <CheckCircle2 className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                      {isDelivered ? 'Delivered' : 'Pending Delivery'}
                    </span>
                  </div>

                  {/* Expected delivery */}
                  {expectedDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Expected: <span className="font-semibold text-violet-600">
                        {expectedDate.toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-1.5">
                  <span className={isPrepaid ? 'text-green-600' : 'text-amber-600'}>① Prepayment</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className={isDelivered ? 'text-blue-600' : 'text-gray-400'}>② Final Payment</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className={isDelivered ? 'text-green-600' : 'text-gray-400'}>③ Delivered</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
                    style={{ width: isDelivered ? '100%' : isPrepaid ? '50%' : '15%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
