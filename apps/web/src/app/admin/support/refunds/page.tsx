'use client';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface RefundRequest { id: string; amount: string; reason: string; status: string; createdAt: string; order?: { id: string; total: string }; user?: { email: string; firstName: string; lastName: string } }

const STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED:  { label: 'Approved',  cls: 'bg-green-100 text-green-700',   icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-100 text-red-700',       icon: XCircle },
  PROCESSED: { label: 'Processed', cls: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
};

export default function RefundRequestsPage() {
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ data: RefundRequest[]; total: number }>({
    queryKey: ['refund-requests'],
    queryFn: () => api.get('/refunds?limit=50').then(r => r.data.data).catch(() => ({ data: [], total: 0 })),
  });

  const refunds = data?.data ?? [];
  const pending  = refunds.filter(r => r.status === 'PENDING');
  const approved = refunds.filter(r => r.status === 'APPROVED' || r.status === 'PROCESSED');

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(id);
    try {
      await api.patch(`/refunds/${id}`, { status });
      toast.success(`Refund ${status.toLowerCase()}`);
      refetch();
    } catch {
      toast.error('Failed to update refund status');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-orange-500" /> Refund Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">Customer refund requests from support tickets.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',       value: String(pending.length),  cls: 'text-yellow-600', bg: 'bg-yellow-50',  icon: AlertTriangle },
          { label: 'Total Requests',value: String(refunds.length),  cls: 'text-gray-700',   bg: 'bg-gray-50',    icon: RotateCcw },
          { label: 'Approved/Paid', value: String(approved.length), cls: 'text-green-600',  bg: 'bg-green-50',   icon: CheckCircle },
          { label: 'Pending Amount',value: formatCurrency(pending.reduce((s, r) => s + parseFloat(r.amount || '0'), 0)), cls: 'text-orange-600', bg: 'bg-orange-50', icon: RotateCcw },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${s.cls}`} />
            </div>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : refunds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <RotateCcw className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No refund requests</p>
          <p className="text-sm text-gray-400 mt-1">Customer refund requests will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Amount', 'Reason', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {refunds.map(r => {
                  const st = STATUS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600', icon: Clock };
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{r.user?.firstName} {r.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{r.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-gray-900">{formatCurrency(parseFloat(r.amount || '0'))}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-BD')}</td>
                      <td className="px-4 py-3">
                        {r.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(r.id, 'APPROVED')}
                              disabled={processing === r.id}
                              className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors">
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'REJECTED')}
                              disabled={processing === r.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-colors">
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
