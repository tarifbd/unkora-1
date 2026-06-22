'use client';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Clock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

interface Withdrawal { id: string; amount: string; method: string; status: string; createdAt: string; seller?: { shopName: string; user?: { email: string } } }
interface WithdrawalsResult { data: Withdrawal[]; total: number; page: number }

const STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-700',   icon: CheckCircle },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700',       icon: XCircle },
};

const METHODS: Record<string, string> = { bkash: '💚 বিকাশ', nagad: '🟠 নগদ', rocket: '🟣 রকেট', bank: '🏦 Bank' };

export default function WalletPage() {
  const { data, isLoading } = useQuery<WithdrawalsResult>({
    queryKey: ['admin-withdrawals'],
    queryFn: () => api.get('/sellers/admin/withdrawals?limit=30').then(r => r.data.data).catch(() => ({ data: [], total: 0, page: 1 })),
  });

  const withdrawals = data?.data ?? [];
  const pendingAmt  = withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + parseFloat(w.amount), 0);
  const approvedAmt = withdrawals.filter(w => w.status === 'APPROVED').reduce((s, w) => s + parseFloat(w.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-orange-500" /> Digital Wallet
        </h1>
        <p className="text-sm text-gray-500 mt-1">Seller withdrawal requests and wallet balances.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Withdrawal', value: formatCurrency(pendingAmt),  cls: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved / Paid',    value: formatCurrency(approvedAmt), cls: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Total Requests',     value: String(withdrawals.length),  cls: 'text-blue-600',   bg: 'bg-blue-50'   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No withdrawal requests yet</p>
          <p className="text-sm text-gray-400 mt-1">Seller withdrawal requests will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Seller', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map(w => {
                  const st = STATUS[w.status] ?? { label: w.status, cls: 'bg-gray-100 text-gray-600', icon: Clock };
                  return (
                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 font-medium">{w.seller?.shopName ?? 'Seller'}<br /><span className="text-xs text-gray-400">{w.seller?.user?.email}</span></td>
                      <td className="px-4 py-3 font-black text-gray-900">{formatCurrency(parseFloat(w.amount))}</td>
                      <td className="px-4 py-3 text-gray-600">{METHODS[w.method] ?? w.method}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(w.createdAt).toLocaleDateString('en-BD')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link href="/admin/sellers"
        className="inline-flex items-center gap-2 text-orange-500 hover:underline text-sm font-semibold">
        Manage Sellers <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
