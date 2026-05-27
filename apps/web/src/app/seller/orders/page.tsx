'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { ShoppingBag, Loader2 } from 'lucide-react';

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:          { label: 'অপেক্ষমাণ',       cls: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:        { label: 'নিশ্চিত',          cls: 'bg-blue-100 text-blue-700' },
  PROCESSING:       { label: 'প্রক্রিয়াধীন',    cls: 'bg-indigo-100 text-indigo-700' },
  SHIPPED:          { label: 'শিপড',             cls: 'bg-purple-100 text-purple-700' },
  OUT_FOR_DELIVERY: { label: 'ডেলিভারিতে',       cls: 'bg-orange-100 text-orange-700' },
  DELIVERED:        { label: 'ডেলিভার হয়েছে',   cls: 'bg-green-100 text-green-700' },
  CANCELLED:        { label: 'বাতিল',            cls: 'bg-red-100 text-red-700' },
  REFUNDED:         { label: 'ফেরত',             cls: 'bg-gray-100 text-gray-600' },
};

export default function SellerOrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'orders', page],
    queryFn: () => sellerApi.myOrders(page),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">অর্ডারসমূহ</h1>
        <p className="text-sm text-gray-500">My Book Orders</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-1">এখনো কোনো অর্ডার নেই</p>
          <p className="text-sm text-gray-400">আপনার বই অনুমোদিত ও প্রকাশিত হলে এখানে অর্ডার দেখাবে।</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">বই</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">অর্ডার নং</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">পরিমাণ</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">মূল্য</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">স্ট্যাটাস</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ক্রেতা</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map((item: any) => {
                    const st = ORDER_STATUS[item.order?.status] ?? { label: item.order?.status, cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {item.product?.images?.[0]?.url ? (
                                <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-gray-300 m-auto mt-4" />
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 line-clamp-2 max-w-[180px]">
                              {item.product?.name ?? item.productName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {item.order?.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-semibold">{item.quantity}টি</td>
                        <td className="px-4 py-4 font-bold text-gray-900">৳{parseFloat(item.totalPrice).toFixed(0)}</td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-xs">
                          {item.order?.user?.firstName} {item.order?.user?.lastName}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-xs">
                          {new Date(item.order?.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                    p === page ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
