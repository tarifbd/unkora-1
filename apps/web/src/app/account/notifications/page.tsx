'use client';

import { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, ShoppingBag, Package, Tag, Star, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

type Channel = 'email' | 'sms' | 'push';

interface NotifPref { key: string; icon: React.ElementType; label: string; desc: string; channels: Record<Channel, boolean> }

const PREFS: NotifPref[] = [
  { key: 'orders',    icon: ShoppingBag, label: 'অর্ডার আপডেট',      desc: 'অর্ডার নিশ্চিতকরণ, শিপমেন্ট, ডেলিভারি',        channels: { email: true,  sms: true,  push: true  } },
  { key: 'delivery',  icon: Package,     label: 'ডেলিভারি স্ট্যাটাস',  desc: 'আউট ফর ডেলিভারি, ডেলিভার হয়েছে',              channels: { email: true,  sms: true,  push: true  } },
  { key: 'promotions',icon: Tag,         label: 'অফার ও প্রমো',        desc: 'এক্সক্লুসিভ ডিল, সেল, কুপন কোড',              channels: { email: true,  sms: false, push: false } },
  { key: 'reviews',   icon: Star,        label: 'রিভিউ রিমাইন্ডার',   desc: 'ডেলিভারির পর পণ্য রিভিউ করার অনুরোধ',          channels: { email: true,  sms: false, push: true  } },
  { key: 'wallet',    icon: Wallet,      label: 'ওয়ালেট ট্রানজেকশন',   desc: 'ক্রেডিট, ডেবিট, রিফান্ড নোটিফিকেশন',          channels: { email: true,  sms: true,  push: true  } },
  { key: 'account',   icon: Bell,        label: 'অ্যাকাউন্ট অ্যাক্টিভিটি', desc: 'লগইন, পাসওয়ার্ড পরিবর্তন, সন্দেহজনক কার্যকলাপ', channels: { email: true,  sms: true,  push: false } },
];

const CHANNEL_ICONS: Record<Channel, React.ElementType> = { email: Mail, sms: MessageSquare, push: Smartphone };
const CHANNEL_LABELS: Record<Channel, string> = { email: 'ইমেইল', sms: 'SMS', push: 'পুশ' };

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState(PREFS);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string, ch: Channel) =>
    setPrefs(p => p.map(x => x.key === key ? { ...x, channels: { ...x.channels, [ch]: !x.channels[ch] } } : x));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">নোটিফিকেশন সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-0.5">কীভাবে আপনাকে জানানো হবে তা নিয়ন্ত্রণ করুন</p>
      </div>

      {/* Channel header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">নোটিফিকেশন</p>
          {(['email', 'sms', 'push'] as Channel[]).map(ch => {
            const Icon = CHANNEL_ICONS[ch];
            return (
              <div key={ch} className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-gray-500" />
                <p className="text-[10px] font-bold text-gray-500 uppercase">{CHANNEL_LABELS[ch]}</p>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-gray-50">
          {prefs.map(pref => {
            const Icon = pref.icon;
            return (
              <div key={pref.key} className="grid grid-cols-[1fr_80px_80px_80px] gap-3 px-5 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pref.label}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{pref.desc}</p>
                  </div>
                </div>
                {(['email', 'sms', 'push'] as Channel[]).map(ch => (
                  <div key={ch} className="flex justify-center">
                    <button onClick={() => toggle(pref.key, ch)}
                      className={cn(
                        'w-10 h-5.5 rounded-full relative transition-colors duration-200 focus:outline-none',
                        pref.channels[ch] ? 'bg-primary' : 'bg-gray-200'
                      )} style={{ width: 36, height: 22 }}>
                      <span className={cn(
                        'absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200',
                        pref.channels[ch] ? 'translate-x-4' : 'translate-x-0.5'
                      )} style={{ width: 18, height: 18, top: 2, left: pref.channels[ch] ? 16 : 2 }} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> নীরব সময়
        </h2>
        <p className="text-sm text-gray-500 mb-4">এই সময়ে SMS ও পুশ নোটিফিকেশন বন্ধ থাকবে</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">শুরু</label>
            <input type="time" defaultValue="22:00" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <span className="text-gray-400 mt-5">–</span>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">শেষ</label>
            <input type="time" defaultValue="08:00" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save}
          className={cn('px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90')}>
          {saved ? '✓ সেভ হয়েছে' : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>
    </div>
  );
}
