'use client';

import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TxType = 'credit' | 'debit' | 'refund';
type TxStatus = 'completed' | 'pending' | 'failed';

const TRANSACTIONS: { id: string; type: TxType; label: string; amount: number; date: string; status: TxStatus }[] = [
  { id: 'TXN001', type: 'credit',  label: 'অর্ডার ক্যান্সেল রিফান্ড #ORD-4421', amount: 1250,  date: '১২ জুন, ২০২৬',  status: 'completed' },
  { id: 'TXN002', type: 'debit',   label: 'অর্ডার পেমেন্ট #ORD-4488',            amount: 3200,  date: '১০ জুন, ২০২৬',  status: 'completed' },
  { id: 'TXN003', type: 'credit',  label: 'রিটার্ন রিফান্ড #RET-112',            amount: 890,   date: '৫ জুন, ২০২৬',   status: 'completed' },
  { id: 'TXN004', type: 'credit',  label: 'ওয়ালেট টপ-আপ (bKash)',               amount: 5000,  date: '১ জুন, ২০২৬',   status: 'completed' },
  { id: 'TXN005', type: 'debit',   label: 'অর্ডার পেমেন্ট #ORD-4350',            amount: 2100,  date: '২৮ মে, ২০২৬',   status: 'completed' },
  { id: 'TXN006', type: 'refund',  label: 'প্রমো ক্যাশব্যাক',                    amount: 200,   date: '২৫ মে, ২০২৬',   status: 'pending' },
];

const TYPE_META: Record<TxType, { icon: React.ElementType; color: string; sign: string }> = {
  credit:  { icon: ArrowDownLeft,  color: 'text-green-600 bg-green-50',  sign: '+' },
  debit:   { icon: ArrowUpRight,   color: 'text-red-500 bg-red-50',      sign: '-' },
  refund:  { icon: RefreshCw,      color: 'text-blue-600 bg-blue-50',    sign: '+' },
};

const STATUS_META: Record<TxStatus, { icon: React.ElementType; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-600' },
  pending:   { icon: Clock,       color: 'text-amber-500' },
  failed:    { icon: XCircle,     color: 'text-red-500' },
};

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const balance = 4140;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">আমার ওয়ালেট</h1>
        <p className="text-sm text-gray-500 mt-0.5">ব্যালেন্স দেখুন এবং লেনদেন ট্র্যাক করুন</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-2 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-white/70" />
            <p className="text-sm text-white/70 font-medium">মোট ব্যালেন্স</p>
          </div>
          <p className="text-4xl font-black mb-4">৳{balance.toLocaleString()}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowTopup(true)}
              className="flex items-center gap-1.5 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> টপ-আপ
            </button>
            <button className="flex items-center gap-1.5 bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" /> ব্যবহার করুন
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'এই মাসে আয়', value: '৳6,340', color: 'text-green-600' },
          { label: 'এই মাসে ব্যয়', value: '৳5,300', color: 'text-red-500' },
          { label: 'মুলতবি', value: '৳200', color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top-up modal */}
      {showTopup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">ওয়ালেট টপ-আপ</h2>
            <button onClick={() => setShowTopup(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
          <div className="flex gap-2">
            {(['bkash', 'nagad', 'card'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-colors capitalize',
                  method === m ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50')}>
                {m === 'bkash' ? 'bKash' : m === 'nagad' ? 'Nagad' : 'কার্ড'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000, 5000].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-colors',
                  amount === String(a) ? 'bg-primary/10 text-primary border-primary/30' : 'border-gray-200 text-gray-600')}>
                ৳{a}
              </button>
            ))}
          </div>
          <input type="number" placeholder="অথবা পরিমাণ লিখুন" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
            টপ-আপ নিশ্চিত করুন
          </button>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">লেনদেনের ইতিহাস</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {TRANSACTIONS.map(tx => {
            const meta = TYPE_META[tx.type];
            const Icon = meta.icon;
            const statusMeta = STATUS_META[tx.status];
            const StatusIcon = statusMeta.icon;
            return (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', meta.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{tx.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[11px] text-gray-400">{tx.date}</p>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <StatusIcon className={cn('w-3 h-3', statusMeta.color)} />
                    <p className={cn('text-[11px] font-medium', statusMeta.color)}>
                      {tx.status === 'completed' ? 'সম্পন্ন' : 'মুলতবি'}
                    </p>
                  </div>
                </div>
                <p className={cn('text-sm font-black flex-shrink-0',
                  tx.type === 'debit' ? 'text-red-500' : 'text-green-600')}>
                  {meta.sign}৳{tx.amount.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
