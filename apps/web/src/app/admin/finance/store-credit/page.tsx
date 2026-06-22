'use client';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Plus, Search, Loader2, Gift, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreditUser { id: string; email: string; firstName: string; lastName: string; walletBalance?: number }

export default function StoreCreditPage() {
  const [search, setSearch] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ data: CreditUser[]; total: number }>({
    queryKey: ['users-credit', search],
    queryFn: () => api.get(`/users?search=${search}&limit=30`).then(r => r.data.data).catch(() => ({ data: [], total: 0 })),
  });

  const users = data?.data ?? [];

  const issueCredit = async () => {
    if (!selectedUser || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please select a user and enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/users/${selectedUser}/wallet/credit`, { amount: parseFloat(amount), note });
      toast.success(`Credit of ${formatCurrency(parseFloat(amount))} issued!`);
      setIssuing(false);
      setSelectedUser('');
      setAmount('');
      setNote('');
      refetch();
    } catch {
      toast.error('Failed to issue store credit');
    } finally {
      setSaving(false);
    }
  };

  const totalCredit = users.reduce((s, u) => s + (u.walletBalance ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-orange-500" /> Store Credit
          </h1>
          <p className="text-sm text-gray-500 mt-1">Issue and manage customer wallet credits.</p>
        </div>
        <button
          onClick={() => setIssuing(true)}
          className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-orange-600 transition-colors">
          <Plus className="h-4 w-4" /> Issue Credit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Credits Issued', value: formatCurrency(totalCredit), icon: Gift, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Customers with Credit', value: String(users.filter(u => (u.walletBalance ?? 0) > 0).length), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Customers', value: String(data?.total ?? 0), icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {issuing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Issue Store Credit</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Select Customer</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                  <option value="">-- Select customer --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Amount (BDT)</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Reason for credit..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setIssuing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={issueCredit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Issue Credit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Email', 'Wallet Balance'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 font-black text-green-600">{formatCurrency(u.walletBalance ?? 0)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-400">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
