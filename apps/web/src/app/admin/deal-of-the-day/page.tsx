'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sun, Plus, Trash2, Save, Loader2, Search,
  Clock, Percent, DollarSign, Tag, Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface DealProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images?: { url: string }[];
}

interface DealOfDay {
  id?: string;
  title: string;
  titleBn: string;
  productId: string;
  product?: DealProduct;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  dealPrice: number;
  startDate: string;
  endDate: string;
  maxQuantity?: number;
  badge?: string;
  isActive: boolean;
}

const DEFAULT_DEAL: Omit<DealOfDay, 'id'> = {
  title: '',
  titleBn: '',
  productId: '',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  dealPrice: 0,
  startDate: new Date().toISOString().split('T')[0] ?? '',
  endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] ?? '',
  maxQuantity: undefined,
  badge: 'Deal of the Day',
  isActive: true,
};

export default function DealOfTheDayPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<DealOfDay, 'id'>>(DEFAULT_DEAL);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: products } = useQuery<{ data: DealProduct[] }>({
    queryKey: ['products-search', productSearch],
    queryFn: () => api.get(`/products?search=${encodeURIComponent(productSearch)}&limit=10`).then(r => r.data?.data ? r.data : { data: r.data?.data ?? [] }),
    enabled: productSearch.length > 1,
  });

  const { data: deals, isLoading } = useQuery<DealOfDay[]>({
    queryKey: ['deals-of-day'],
    queryFn: () => api.get('/flash-deals').then(r => r.data?.data ?? r.data ?? []),
    staleTime: 30_000,
  });

  const saveDeal = async () => {
    if (!form.title || !form.productId) {
      toast.error('Please fill in title and select a product');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    void qc.invalidateQueries({ queryKey: ['deals-of-day'] });
    toast.success('Deal of the Day saved!');
    setForm(DEFAULT_DEAL);
  };

  const inputCls = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';
  const labelCls = 'block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-5 h-5 text-orange-500" />
            <h1 className="text-xl font-black text-gray-900">Deal of the Day</h1>
          </div>
          <p className="text-sm text-gray-500">Feature one special deal daily with countdown timer on the homepage and dedicated page</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Create/Edit form */}
        <div className="lg:col-span-3 bg-white rounded-2xl border p-5 space-y-4">
          <h2 className="font-bold text-gray-900 pb-2 border-b">New Deal</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title (English) *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Today's Hot Deal" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Title (Bangla)</label>
              <input value={form.titleBn} onChange={e => setForm(f => ({ ...f, titleBn: e.target.value }))}
                placeholder="আজকের ডিল" className={inputCls} />
            </div>
          </div>

          {/* Product selector */}
          <div>
            <label className={labelCls}>Search & Select Product *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Type product name..."
                className={`${inputCls} pl-9`}
              />
            </div>
            {products && products.data && products.data.length > 0 && (
              <div className="mt-1 border rounded-xl overflow-hidden shadow-sm max-h-40 overflow-y-auto">
                {products.data.map((p: DealProduct) => (
                  <button key={p.id} onClick={() => { setForm(f => ({ ...f, productId: p.id })); setProductSearch(p.name); }}
                    className={`w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-0 ${form.productId === p.id ? 'bg-primary/5' : ''}`}>
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-gray-800 text-xs">{p.name}</p>
                      <p className="text-[10px] text-gray-400">৳{p.basePrice}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Discount Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))} className={inputCls}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Discount Value</label>
              <input type="number" min="1" value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Qty</label>
              <input type="number" min="1" value={form.maxQuantity ?? ''}
                onChange={e => setForm(f => ({ ...f, maxQuantity: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Unlimited" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Badge Text</label>
              <input value={form.badge ?? ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="Deal of the Day" className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={saveDeal} disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Deal
            </button>
          </div>
        </div>

        {/* Active deals list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900">Active Deals</h2>
            <span className="text-xs text-gray-400">{deals?.length ?? 0} deals</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : deals && deals.length > 0 ? (
            <div className="divide-y overflow-y-auto max-h-[500px]">
              {deals.map((deal: DealOfDay) => (
                <div key={deal.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{deal.title || 'Untitled Deal'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {deal.endDate ? new Date(deal.endDate).toLocaleDateString() : 'No end date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${deal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {deal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Sun className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-sm">No deals yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
