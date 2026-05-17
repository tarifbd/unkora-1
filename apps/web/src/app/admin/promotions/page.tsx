'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Star, Tag, Search, Loader2, CheckCircle2, XCircle, Percent, X } from 'lucide-react';
import Image from 'next/image';
import { productsApi, type Product } from '@/lib/api/products';
import api from '@/lib/api';

type Tab = 'flash' | 'featured' | 'discount';

function DiscountModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [discount, setDiscount] = useState('');
  const [salePrice, setSalePrice] = useState(product.salePrice ? String(Number(product.salePrice)) : '');

  const save = useMutation({
    mutationFn: (data: { salePrice?: number | null }) =>
      api.patch(`/products/${product.id}`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products-promo'] });
      onClose();
    },
  });

  const calcFromDiscount = (pct: string) => {
    const p = parseFloat(pct);
    if (!isNaN(p) && p > 0 && p < 100) {
      setSalePrice(String(Math.round(Number(product.basePrice) * (1 - p / 100))));
    }
  };

  const calcFromPrice = (price: string) => {
    const p = parseFloat(price);
    const base = Number(product.basePrice);
    if (!isNaN(p) && p > 0 && p < base) {
      setDiscount(String(Math.round((1 - p / base) * 100)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Set Discount</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
          {product.images[0]?.url ? (
            <Image src={product.images[0].url} alt={product.name} width={48} height={48} unoptimized className="w-12 h-12 object-cover rounded-lg" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl">📦</div>
          )}
          <div>
            <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
            <p className="text-sm text-gray-500">Base price: ৳{Number(product.basePrice).toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Discount %</label>
            <div className="relative">
              <input
                type="number" min="0" max="99" value={discount}
                onChange={e => { setDiscount(e.target.value); calcFromDiscount(e.target.value); }}
                placeholder="e.g. 20"
                className="w-full border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sale Price (৳)</label>
            <input
              type="number" min="0" value={salePrice}
              onChange={e => { setSalePrice(e.target.value); calcFromPrice(e.target.value); }}
              placeholder="Enter sale price"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {salePrice && Number(salePrice) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <span className="text-green-700 font-bold">৳{Number(salePrice).toLocaleString()}</span>
              <span className="text-green-600"> — {discount}% off</span>
              <span className="text-gray-500"> (save ৳{(Number(product.basePrice) - Number(salePrice)).toLocaleString()})</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => save.mutate({ salePrice: salePrice ? Number(salePrice) : null })}
            disabled={save.isPending}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 font-bold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Discount
          </button>
          {product.salePrice && (
            <button
              onClick={() => save.mutate({ salePrice: null })}
              disabled={save.isPending}
              className="px-4 bg-red-50 text-red-600 rounded-xl py-2.5 font-bold text-sm hover:bg-red-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('flash');
  const [search, setSearch] = useState('');
  const [discountModal, setDiscountModal] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products-promo', search],
    queryFn: () => productsApi.getAll({ limit: 50, search: search || undefined }),
  });

  const products = data?.data ?? [];

  const toggleFeatured = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      api.patch(`/products/${id}`, { isFeatured: val }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products-promo'] }),
  });

  const toggleFlashDeal = useMutation({
    mutationFn: ({ id, tags, isFlash }: { id: string; tags: string[]; isFlash: boolean }) => {
      const newTags = isFlash
        ? [...tags.filter(t => t !== 'flash-deal'), 'flash-deal']
        : tags.filter(t => t !== 'flash-deal');
      return api.patch(`/products/${id}`, { tags: newTags }).then(r => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products-promo'] }),
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'flash', label: 'Flash Deals', icon: Zap, desc: 'Products shown in flash deal section' },
    { id: 'featured', label: 'Featured', icon: Star, desc: 'Featured products on homepage' },
    { id: 'discount', label: 'Discounts', icon: Tag, desc: 'Set sale prices & discount %' },
  ];

  const filteredProducts = products.filter(p => {
    if (tab === 'flash') return true;
    if (tab === 'featured') return true;
    if (tab === 'discount') return true;
    return true;
  });

  const flashCount = products.filter(p => p.tags.includes('flash-deal')).length;
  const featuredCount = products.filter(p => p.isFeatured).length;
  const discountCount = products.filter(p => p.salePrice && Number(p.salePrice) < Number(p.basePrice)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage flash deals, featured products, and discounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Flash Deals', value: flashCount, icon: Zap, color: 'text-orange-500 bg-orange-50' },
          { label: 'Featured', value: featuredCount, icon: Star, color: 'text-yellow-500 bg-yellow-50' },
          { label: 'On Discount', value: discountCount, icon: Tag, color: 'text-green-500 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}

      {/* Product List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Base Price</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Sale Price</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Flash Deal</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Featured</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(p => {
              const isFlash = p.tags.includes('flash-deal');
              const disc = p.salePrice && Number(p.salePrice) < Number(p.basePrice)
                ? Math.round((1 - Number(p.salePrice) / Number(p.basePrice)) * 100)
                : null;

              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0]?.url ? (
                        <Image src={p.images[0].url} alt={p.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">📦</div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">৳{Number(p.basePrice).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {p.salePrice && Number(p.salePrice) < Number(p.basePrice) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-green-600">৳{Number(p.salePrice).toLocaleString()}</span>
                        <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded">{disc}% OFF</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFlashDeal.mutate({ id: p.id, tags: p.tags, isFlash: !isFlash })}
                      disabled={toggleFlashDeal.isPending}
                      className="mx-auto block"
                    >
                      {isFlash
                        ? <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        : <XCircle className="w-5 h-5 text-gray-300 hover:text-orange-400 transition-colors" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFeatured.mutate({ id: p.id, val: !p.isFeatured })}
                      disabled={toggleFeatured.isPending}
                      className="mx-auto block"
                    >
                      {p.isFeatured
                        ? <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                        : <XCircle className="w-5 h-5 text-gray-300 hover:text-yellow-400 transition-colors" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDiscountModal(p)}
                      className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      Set Discount
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && !filteredProducts.length && (
          <div className="py-12 text-center text-gray-400">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {discountModal && <DiscountModal product={discountModal} onClose={() => setDiscountModal(null)} />}
    </div>
  );
}
