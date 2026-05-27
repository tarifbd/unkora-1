'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { Settings, Loader2, CheckCircle, Store, Phone, MapPin, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerProfilePage() {
  const qc = useQueryClient();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', 'me'],
    queryFn: sellerApi.getMe,
    retry: 1,
  });

  const [form, setForm] = useState({
    shopName: '', description: '', phone: '',
    address: '', bankName: '', bankAccount: '',
    logoUrl: '', bannerUrl: '',
  });

  useEffect(() => {
    if (seller) {
      setForm({
        shopName:    seller.shopName ?? '',
        description: seller.description ?? '',
        phone:       seller.phone ?? '',
        address:     seller.address ?? '',
        bankName:    seller.bankName ?? '',
        bankAccount: seller.bankAccount ?? '',
        logoUrl:     seller.logoUrl ?? '',
        bannerUrl:   seller.bannerUrl ?? '',
      });
    }
  }, [seller]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => sellerApi.updateMe(data),
    onSuccess: () => {
      toast.success('প্রোফাইল আপডেট হয়েছে!');
      qc.invalidateQueries({ queryKey: ['seller', 'me'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'আপডেটে সমস্যা হয়েছে।');
    },
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white';
  const labelCls = 'block text-sm font-bold text-gray-700 mb-1.5';

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">শপ সেটিংস</h1>
        <p className="text-sm text-gray-500">Shop Profile Settings</p>
      </div>

      {/* Read-only info */}
      {seller && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">স্লাগ:</span>
            <span className="font-semibold text-gray-800">@{seller.shopSlug}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">কমিশন:</span>
            <span className="font-bold text-primary">{seller.commissionRate}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">স্ট্যাটাস:</span>
            <StatusBadge status={seller.status} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Shop Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Store className="w-4 h-4 text-gray-500" /> দোকানের তথ্য
          </h3>
          <div>
            <label className={labelCls}>দোকানের নাম *</label>
            <input className={inputCls} value={form.shopName} onChange={e => set('shopName', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>বিবরণ</label>
            <textarea
              className={`${inputCls} resize-none`} rows={3}
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="আপনার দোকান সম্পর্কে বলুন..."
            />
          </div>
          <div>
            <label className={labelCls}>লোগো URL</label>
            <input className={inputCls} value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>ব্যানার URL</label>
            <input className={inputCls} value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Phone className="w-4 h-4 text-gray-500" /> যোগাযোগ
          </h3>
          <div>
            <label className={labelCls}>মোবাইল নম্বর</label>
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className={labelCls}>ঠিকানা</label>
            <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="সম্পূর্ণ ঠিকানা" />
          </div>
        </div>

        {/* Bank */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <CreditCard className="w-4 h-4 text-gray-500" /> পেমেন্ট তথ্য
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ব্যাংকের নাম</label>
              <input className={inputCls} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Bank name" />
            </div>
            <div>
              <label className={labelCls}>অ্যাকাউন্ট নম্বর</label>
              <input className={inputCls} value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="Account number" />
            </div>
          </div>
          <p className="text-xs text-gray-400">এই তথ্য শুধু উত্তোলনের জন্য ব্যবহৃত হবে। নিরাপদ ও এনক্রিপ্টেড।</p>
        </div>

        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {updateMutation.isPending ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:    { label: 'সক্রিয়',    cls: 'bg-green-100 text-green-700' },
    PENDING:   { label: 'অপেক্ষমাণ', cls: 'bg-yellow-100 text-yellow-700' },
    SUSPENDED: { label: 'স্থগিত',    cls: 'bg-red-100 text-red-700' },
    REJECTED:  { label: 'প্রত্যাখ্যাত', cls: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}
