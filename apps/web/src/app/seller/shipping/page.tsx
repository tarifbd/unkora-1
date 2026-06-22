'use client';

import { useState } from 'react';
import { Truck, Plus, Edit2, Trash2, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const ZONES = [
  { id: 1, name: 'ঢাকা মেট্রো',     areas: ['ঢাকা সিটি', 'নারায়ণগঞ্জ'],                 days: '১-২',  fee: 60,  freeAbove: 1500 },
  { id: 2, name: 'চট্টগ্রাম',        areas: ['চট্টগ্রাম সিটি', 'কুমিল্লা'],               days: '২-৩',  fee: 100, freeAbove: 2000 },
  { id: 3, name: 'সিলেট',            areas: ['সিলেট সিটি', 'মৌলভীবাজার'],                 days: '3-4',  fee: 120, freeAbove: 2000 },
  { id: 4, name: 'সারা বাংলাদেশ',   areas: ['রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর'], days: '৩-৫',  fee: 150, freeAbove: 2500 },
];

const COURIERS = [
  { name: 'Pathao Courier',  enabled: true,  tracking: true  },
  { name: 'RedX',            enabled: true,  tracking: true  },
  { name: 'Sundarban Courier', enabled: false, tracking: false },
  { name: 'SA Paribahan',    enabled: false, tracking: false },
];

export default function SellerShippingPage() {
  const [zones, setZones] = useState(ZONES);
  const [couriers, setCouriers] = useState(COURIERS);
  const [editing, setEditing] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const toggleCourier = (name: string) =>
    setCouriers(c => c.map(x => x.name === name ? { ...x, enabled: !x.enabled } : x));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">শিপিং সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-0.5">ডেলিভারি জোন, কুরিয়ার ও চার্জ সেট করুন</p>
      </div>

      {/* Shipping zones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> ডেলিভারি জোন
          </h2>
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> জোন যোগ
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {zones.map(zone => (
            <div key={zone.id} className="px-5 py-4">
              {editing === zone.id ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">জোনের নাম</label>
                    <input defaultValue={zone.name} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">শিপিং চার্জ (৳)</label>
                    <input type="number" defaultValue={zone.fee} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ফ্রি শিপিং হতে (৳)</label>
                    <input type="number" defaultValue={zone.freeAbove} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <button onClick={() => setEditing(null)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">সেভ</button>
                    <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">বাতিল</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <p className="text-sm font-bold text-gray-900">{zone.name}</p>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{zone.days} দিন</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.areas.map(a => (
                        <span key={a} className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-gray-900">৳{zone.fee}</p>
                    <p className="text-[10px] text-green-600">৳{zone.freeAbove}+ ফ্রি</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(zone.id)} className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Courier partners */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" /> কুরিয়ার পার্টনার
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {couriers.map(c => (
            <div key={c.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{c.tracking ? 'ট্র্যাকিং সাপোর্ট আছে' : 'ট্র্যাকিং নেই'}</p>
              </div>
              <button onClick={() => toggleCourier(c.name)}
                className={cn('relative rounded-full transition-colors duration-200 focus:outline-none', c.enabled ? 'bg-primary' : 'bg-gray-200')}
                style={{ width: 44, height: 26 }}>
                <span className={cn('absolute bg-white rounded-full shadow transition-all duration-200')}
                  style={{ width: 18, height: 18, top: 4, left: c.enabled ? 22 : 4 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" /> প্যাকেজিং সেটিংস
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">প্রসেসিং সময় (দিন)</label>
            <input type="number" defaultValue={1} min={0} max={7} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ডিফল্ট প্যাকেজ ওজন (গ্রাম)</label>
            <input type="number" defaultValue={500} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className={cn('px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90')}>
          {saved ? '✓ সেভ হয়েছে' : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>
    </div>
  );
}
