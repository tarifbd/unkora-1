'use client';

import { useState } from 'react';
import { Package2, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Tag, TrendingUp, ShoppingCart, Search, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

type ComboStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

interface ComboProduct {
  name: string;
  variant?: string;
  price: number;
  qty: number;
}

interface ComboOffer {
  id: string;
  title: string;
  status: ComboStatus;
  products: ComboProduct[];
  originalPrice: number;
  offerPrice: number;
  discount: number;
  sold: number;
  stock: number;
  startDate: string;
  endDate: string;
  tags: string[];
}

const COMBOS: ComboOffer[] = [
  {
    id: 'CMB-001',
    title: 'ক্লাস ৯-১০ সম্পূর্ণ সেট',
    status: 'active',
    products: [
      { name: 'গণিত', variant: 'নবম-দশম', price: 250, qty: 1 },
      { name: 'বিজ্ঞান', variant: 'নবম-দশম', price: 280, qty: 1 },
      { name: 'বাংলা ব্যাকরণ', price: 180, qty: 1 },
      { name: 'ইংরেজি গ্রামার', price: 200, qty: 1 },
    ],
    originalPrice: 910, offerPrice: 699, discount: 23, sold: 142, stock: 58, startDate: '১ জুন ২০২৫', endDate: '৩০ জুন ২০২৫', tags: ['SSC', 'পরীক্ষার প্রস্তুতি'],
  },
  {
    id: 'CMB-002',
    title: 'Python & Data Science Starter',
    status: 'active',
    products: [
      { name: 'Python Programming — 3rd Ed.', variant: 'হার্ডকভার', price: 1600, qty: 1 },
      { name: 'Data Structures Vol 1', variant: 'পেপারব্যাক', price: 2100, qty: 1 },
      { name: 'Machine Learning Basics', price: 1800, qty: 1 },
    ],
    originalPrice: 5500, offerPrice: 4299, discount: 22, sold: 67, stock: 33, startDate: '১৫ মে ২০২৫', endDate: '১৫ জুলাই ২০২৫', tags: ['প্রযুক্তি', 'কোডিং'],
  },
  {
    id: 'CMB-003',
    title: 'বাংলা সাহিত্য মেগা প্যাক',
    status: 'scheduled',
    products: [
      { name: 'রবীন্দ্র রচনাবলী', variant: 'মানক', price: 1800, qty: 1 },
      { name: 'নজরুল সমগ্র', price: 1200, qty: 1 },
      { name: 'আধুনিক বাংলা কবিতা', price: 650, qty: 1 },
    ],
    originalPrice: 3650, offerPrice: 2799, discount: 23, sold: 0, stock: 100, startDate: '১ জুলাই ২০২৫', endDate: '৩১ জুলাই ২০২৫', tags: ['সাহিত্য', 'উপহার'],
  },
  {
    id: 'CMB-004',
    title: 'শিশু শিক্ষা বান্ডেল',
    status: 'inactive',
    products: [
      { name: 'বাংলা বর্ণমালা', price: 120, qty: 1 },
      { name: 'রঙ ও আঁকা', price: 150, qty: 1 },
      { name: 'ছড়ার বই', price: 90, qty: 2 },
    ],
    originalPrice: 450, offerPrice: 349, discount: 22, sold: 289, stock: 0, startDate: '১ মার্চ ২০২৫', endDate: '৩১ মে ২০২৫', tags: ['শিশু', 'প্রাথমিক'],
  },
];

const STATUS_META: Record<ComboStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'সক্রিয়',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  inactive:  { label: 'নিষ্ক্রিয়', color: 'text-gray-600',   bg: 'bg-gray-100',  border: 'border-gray-200'  },
  scheduled: { label: 'নির্ধারিত', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  expired:   { label: 'মেয়াদোত্তীর্ণ', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200'  },
};

export default function ComboOffersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ComboStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ComboStatus>>(
    Object.fromEntries(COMBOS.map(c => [c.id, c.status]))
  );

  const filtered = COMBOS
    .filter(c => filter === 'all' || statuses[c.id] === filter)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));

  const totalSold = COMBOS.reduce((s, c) => s + c.sold, 0);
  const activeCount = COMBOS.filter(c => statuses[c.id] === 'active').length;
  const revenue = COMBOS.reduce((s, c) => s + c.sold * c.offerPrice, 0);
  const avgDiscount = Math.round(COMBOS.reduce((s, c) => s + c.discount, 0) / COMBOS.length);

  const toggleStatus = (id: string) => {
    setStatuses(prev => ({ ...prev, [id]: prev[id] === 'active' ? 'inactive' : 'active' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Combo Offers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">পণ্য বান্ডেল ও কম্বো অফার পরিচালনা করুন</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> নতুন কম্বো তৈরি করুন
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট কম্বো',    value: COMBOS.length,                icon: Package2,    color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'সক্রিয় কম্বো', value: activeCount,                  icon: ToggleRight, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'মোট বিক্রয়',  value: `${totalSold} সেট`,           icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'মোট রাজস্ব',   value: `৳${revenue.toLocaleString()}`, icon: TrendingUp,  color: 'text-amber-600',  bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="কম্বো নাম বা ID খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive', 'scheduled', 'expired'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                filter === f ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
              {f === 'all' ? 'সব' : STATUS_META[f as ComboStatus]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* Combo Cards */}
      <div className="space-y-3">
        {filtered.map(combo => {
          const currentStatus = statuses[combo.id] as ComboStatus;
          const meta = STATUS_META[currentStatus] ?? STATUS_META.inactive;
          const isExpanded = expandedId === combo.id;
          const savings = combo.originalPrice - combo.offerPrice;
          return (
            <div key={combo.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Main Row */}
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package2 className="w-6 h-6 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{combo.title}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', meta.color, meta.bg, meta.border)}>
                      {meta.label}
                    </span>
                    {combo.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {combo.id} · {combo.products.length}টি পণ্য · {combo.startDate} – {combo.endDate}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black">৳{combo.offerPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground line-through">৳{combo.originalPrice.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-green-600">৳{savings} সাশ্রয় ({combo.discount}%)</p>
                </div>

                {/* Stats */}
                <div className="text-center flex-shrink-0">
                  <p className="text-lg font-black">{combo.sold}</p>
                  <p className="text-[10px] text-muted-foreground">বিক্রয়</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className={cn('text-lg font-black', combo.stock === 0 ? 'text-red-500' : combo.stock < 20 ? 'text-amber-500' : '')}>
                    {combo.stock}
                  </p>
                  <p className="text-[10px] text-muted-foreground">স্টক</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleStatus(combo.id)} title="চালু/বন্ধ করুন">
                    {currentStatus === 'active'
                      ? <ToggleRight className="w-7 h-7 text-green-500" />
                      : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : combo.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Expanded: Product Breakdown */}
              {isExpanded && (
                <div className="border-t bg-muted/20 px-5 py-4">
                  <p className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wide">কম্বোতে থাকা পণ্যসমূহ</p>
                  <div className="space-y-2">
                    {combo.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-card rounded-lg px-3 py-2 border">
                        <div>
                          <span className="font-semibold">{p.name}</span>
                          {p.variant && <span className="text-xs text-muted-foreground ml-2">({p.variant})</span>}
                          {p.qty > 1 && <span className="text-xs text-blue-600 font-bold ml-2">× {p.qty}</span>}
                        </div>
                        <span className="font-bold">৳{(p.price * p.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-bold">মোট সঞ্চয়</span>
                    <span className="text-base font-black text-green-600">৳{savings.toLocaleString()} ({combo.discount}% ছাড়)</span>
                  </div>
                  {/* Sales bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>বিক্রয় অগ্রগতি</span>
                      <span>{combo.sold} / {combo.sold + combo.stock} সেট</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.round((combo.sold / (combo.sold + combo.stock || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">নতুন কম্বো অফার তৈরি</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">কম্বোর নাম</label>
                <input placeholder="যেমন: SSC সম্পূর্ণ সেট" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">শুরুর তারিখ</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">শেষের তারিখ</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">পণ্য যোগ করুন</label>
                <div className="border rounded-lg p-3 bg-muted/10 space-y-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex gap-2">
                      <input placeholder={`পণ্য ${n}`} className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <input type="number" placeholder="দাম" className="w-24 px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  ))}
                  <button className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                    <Plus className="w-3 h-3" /> আরও পণ্য যোগ করুন
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">কম্বো মূল্য (৳)</label>
                  <input type="number" placeholder="অফার মূল্য" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">স্টক সংখ্যা</label>
                  <input type="number" placeholder="পরিমাণ" className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted transition-colors">বাতিল</button>
              <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">তৈরি করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
