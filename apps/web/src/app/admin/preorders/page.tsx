'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function PreordersPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({ queryKey: ['preorders-admin'], queryFn: () => apiFetch('/preorders/admin'), enabled: !!token, select: r => r.data ?? r });

  const toggleMutation = useMutation({
    mutationFn: ({ productId, isActive }: any) => apiFetch(`/preorders/admin/product/${productId}`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['preorders-admin'] }); toast.success('Updated'); },
  });

  const items = data?.data ?? (Array.isArray(data) ? data : []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center"><Clock className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preorders</h1><p className="text-sm text-gray-500">Manage product preorder configurations</p></div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>{['Product','Prepayment','Expected Delivery','Stock Limit','Orders','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3"><p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{p.product?.name}</p></td>
                  <td className="px-4 py-3">{p.prepaymentPct}%</td>
                  <td className="px-4 py-3 text-gray-500">{p.expectedDelivery ? new Date(p.expectedDelivery).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">{p.stockLimit ?? '∞'}</td>
                  <td className="px-4 py-3"><span className="font-bold text-orange-600">{p._count?.orders ?? 0}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleMutation.mutate({ productId: p.productId, isActive: !p.isActive })}>
                      {p.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3"><Link href={`/admin/products/edit/${p.productId}`} className="text-xs text-blue-500 hover:underline">Edit Product</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="text-center py-10 text-gray-400">No preorders configured. Configure a preorder via the product edit page.</p>}
        </div>
      )}
    </div>
  );
}
