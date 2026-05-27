'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Loader2, Plus, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'অপেক্ষমাণ', cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'অনুমোদিত', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'বাতিল',     cls: 'bg-red-100 text-red-700' },
};

const METHODS = [
  { value: 'bkash',  label: 'বিকাশ',  icon: '💚' },
  { value: 'nagad',  label: 'নগদ',    icon: '🟠' },
  { value: 'rocket', label: 'রকেট',   icon: '🟣' },
  { value: 'bank',   label: 'ব্যাংক', icon: '🏦' },
];

export default function SellerWithdrawalsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [note, setNote] = useState('');
  const [page, setPage] = useState(1);

  const { data: earnings } = useQuery({
    queryKey: ['seller', 'earnings'],
    queryFn: sellerApi.myEarnings,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'withdrawals', page],
    queryFn: () => sellerApi.myWithdrawals(page),
  });

  const requestMutation = useMutation({
    mutationFn: sellerApi.requestWithdrawal,
    onSuccess: () => {
      toast.success('উত্তোলনের আবেদন সফলভাবে করা হয়েছে!');
      qc.invalidateQueries({ queryKey: ['seller', 'withdrawals'] });
      qc.invalidateQueries({ queryKey: ['seller', 'earnings'] });
      setShowModal(false);
      setAmount('');
      setNote('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'উত্তোলন আবেদনে সমস্যা হয়েছে।');
    },
  });

  const handleRequest = () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { toast.error('সর্বনিম্ন ১০০ টাকা উত্তোলন করা যাবে।'); return; }
    if (earnings && amt > earnings.available) { toast.error('পর্যাপ্ত ব্যালেন্স নেই।'); return; }
    requestMutation.mutate({ amount: amt, method, note: note || undefined });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">উত্তোলন</h1>
          <p className="text-sm text-gray-500">Withdrawal Requests</p>
        </div>
        {earnings && earnings.available >= 100 && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> উত্তোলন করুন
          </button>
        )}
      </div>

      {/* Balance summary */}
      {earnings && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'উপলব্ধ', value: formatCurrency(earnings.available), cls: 'text-green-600' },
            { label: 'অপেক্ষমাণ', value: formatCurrency(earnings.pendingWithdrawal), cls: 'text-orange-600' },
            { label: 'উত্তোলিত', value: formatCurrency(earnings.withdrawn), cls: 'text-gray-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-black ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Withdrawals table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Wallet className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-1">এখনো কোনো উত্তোলন নেই</p>
          <p className="text-sm text-gray-400">
            {earnings && earnings.available >= 100
              ? 'উপরের বোতামে ক্লিক করে উত্তোলনের আবেদন করুন।'
              : 'সর্বনিম্ন ৳100 আয় হলে উত্তোলন করা যাবে।'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">পরিমাণ</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">পদ্ধতি</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">স্ট্যাটাস</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">নোট</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">তারিখ</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">প্রক্রিয়া তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map(wd => {
                    const st = STATUS_MAP[wd.status] ?? { label: wd.status, cls: 'bg-gray-100 text-gray-600' };
                    const meth = METHODS.find(m => m.value === wd.method);
                    return (
                      <tr key={wd.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900 text-base">{formatCurrency(parseFloat(wd.amount))}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                            <span>{meth?.icon ?? '💳'}</span>
                            {meth?.label ?? wd.method}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs max-w-[150px] truncate">{wd.note ?? '—'}</td>
                        <td className="px-4 py-4 text-gray-400 text-xs">
                          {new Date(wd.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-xs">
                          {wd.processedAt ? new Date(wd.processedAt).toLocaleDateString('bn-BD') : '—'}
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

      {/* Request modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">উত্তোলনের আবেদন</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">উপলব্ধ ব্যালেন্স</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(earnings?.available ?? 0)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">পরিমাণ (টাকা) *</label>
                <input
                  type="number" min="100" max={earnings?.available ?? 0}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="সর্বনিম্ন ৳100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">পদ্ধতি *</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        method === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">নোট (ঐচ্ছিক)</label>
                <input
                  value={note} onChange={e => setNote(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="অ্যাকাউন্ট নম্বর বা অন্য তথ্য..."
                />
              </div>

              <button
                onClick={handleRequest}
                disabled={requestMutation.isPending}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {requestMutation.isPending ? 'আবেদন হচ্ছে...' : 'আবেদন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
