'use client';

import { useState } from 'react';
import { Map, Search, User, ShoppingBag, Heart, Star, Package, Mail, MessageSquare, ArrowRight, Clock } from 'lucide-react';

const CUSTOMERS = [
  { id: 1, name: 'Rahim Ahmed', phone: '01711-234567', segment: 'Champion', ltv: 24800, orders: 18, lastActive: '2h ago' },
  { id: 2, name: 'Fatema Begum', phone: '01812-345678', segment: 'Loyal', ltv: 12400, orders: 9, lastActive: '1d ago' },
  { id: 3, name: 'Karim Mia', phone: '01934-567890', segment: 'Potential', ltv: 5600, orders: 4, lastActive: '5d ago' },
  { id: 4, name: 'Nasrin Sultana', phone: '01611-678901', segment: 'At Risk', ltv: 2800, orders: 2, lastActive: '45d ago' },
];

type EventType = 'visit' | 'search' | 'view' | 'wishlist' | 'cart' | 'order' | 'review' | 'email' | 'support';

interface JourneyEvent {
  type: EventType;
  label: string;
  detail: string;
  time: string;
  value?: number;
}

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  visit: User, search: Search, view: Heart, wishlist: Heart,
  cart: ShoppingBag, order: Package, review: Star, email: Mail, support: MessageSquare,
};

const EVENT_COLORS: Record<EventType, string> = {
  visit: 'bg-gray-50 border-gray-200 text-gray-600',
  search: 'bg-blue-50 border-blue-200 text-blue-600',
  view: 'bg-purple-50 border-purple-200 text-purple-600',
  wishlist: 'bg-pink-50 border-pink-200 text-pink-600',
  cart: 'bg-orange-50 border-orange-200 text-orange-600',
  order: 'bg-green-50 border-green-200 text-green-600',
  review: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  email: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  support: 'bg-red-50 border-red-200 text-red-600',
};

const JOURNEY_EVENTS: Record<number, JourneyEvent[]> = {
  1: [
    { type: 'visit', label: 'Store Visit', detail: 'Arrived via Facebook ad', time: 'Jun 8, 11:42 AM' },
    { type: 'search', label: 'Searched', detail: '"হুমায়ূন আহমেদ" — 24 results', time: 'Jun 8, 11:43 AM' },
    { type: 'view', label: 'Viewed Product', detail: 'হুমায়ূন সমগ্র · ৳600', time: 'Jun 8, 11:44 AM' },
    { type: 'wishlist', label: 'Added to Wishlist', detail: 'হুমায়ূন সমগ্র', time: 'Jun 8, 11:45 AM' },
    { type: 'view', label: 'Viewed Product', detail: 'নবীদের গল্প · ৳300', time: 'Jun 8, 11:47 AM' },
    { type: 'cart', label: 'Added to Cart', detail: '2 items · ৳900', time: 'Jun 8, 11:49 AM' },
    { type: 'order', label: 'Order Placed', detail: '#ORD-8841 · ৳900 + ৳60 shipping', time: 'Jun 8, 11:52 AM', value: 960 },
    { type: 'email', label: 'Confirmation Email', detail: 'Order confirmed — opened 4 min later', time: 'Jun 8, 11:53 AM' },
    { type: 'review', label: 'Left Review', detail: 'হুমায়ূন সমগ্র · ★★★★★', time: 'Jun 10, 3:12 PM' },
  ],
  2: [
    { type: 'visit', label: 'Store Visit', detail: 'Organic search — Google', time: 'Jun 7, 2:15 PM' },
    { type: 'view', label: 'Viewed Product', detail: 'SSC Physics Guide · ৳400', time: 'Jun 7, 2:17 PM' },
    { type: 'cart', label: 'Added to Cart', detail: '1 item · ৳400', time: 'Jun 7, 2:21 PM' },
    { type: 'order', label: 'Order Placed', detail: '#ORD-8820 · ৳400', time: 'Jun 7, 2:24 PM', value: 400 },
    { type: 'support', label: 'Support Ticket', detail: 'Delivery delay query — resolved in 30min', time: 'Jun 8, 10:00 AM' },
  ],
  3: [
    { type: 'visit', label: 'Store Visit', detail: 'SMS campaign click', time: 'Jun 4, 6:30 PM' },
    { type: 'view', label: 'Viewed Product', detail: 'Quran Sharif · ৳800', time: 'Jun 4, 6:32 PM' },
    { type: 'cart', label: 'Added to Cart', detail: '1 item · ৳800', time: 'Jun 4, 6:35 PM' },
    { type: 'visit', label: 'Return Visit', detail: 'Direct — 2 days later', time: 'Jun 6, 8:12 PM' },
    { type: 'order', label: 'Order Placed', detail: '#ORD-8798 · ৳800', time: 'Jun 6, 8:20 PM', value: 800 },
  ],
  4: [
    { type: 'visit', label: 'Store Visit', detail: 'Email newsletter', time: 'Apr 20, 4:00 PM' },
    { type: 'view', label: 'Viewed Product', detail: 'রবীন্দ্র রচনাবলী · ৳700', time: 'Apr 20, 4:03 PM' },
    { type: 'wishlist', label: 'Added to Wishlist', detail: 'রবীন্দ্র রচনাবলী', time: 'Apr 20, 4:05 PM' },
    { type: 'email', label: 'Wishlist Reminder Email', detail: 'Sent — unopened', time: 'Apr 25, 10:00 AM' },
  ],
};

const SEGMENT_COLORS: Record<string, string> = {
  Champion: 'bg-purple-100 text-purple-700',
  Loyal: 'bg-green-100 text-green-700',
  Potential: 'bg-yellow-100 text-yellow-700',
  'At Risk': 'bg-red-100 text-red-700',
};

export default function CustomerJourneyPage() {
  const [selected, setSelected] = useState(CUSTOMERS[0]);
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );
  const events = JOURNEY_EVENTS[selected.id] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <Map className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h2 className="font-black text-lg">Customer Journey Mapping</h2>
          <p className="text-xs text-muted-foreground">Visualize every touchpoint in a customer's lifecycle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search customer..."
                className="pl-9 pr-3 py-2 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="divide-y max-h-[60vh] overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${selected.id === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEGMENT_COLORS[c.segment]}`}>{c.segment}</span>
                    <span className="text-xs text-muted-foreground">{c.orders} orders</span>
                  </div>
                </div>
                {selected.id === c.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Journey timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer summary */}
          <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-6 flex-wrap">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black">
              {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-black text-base">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.phone} · Last active {selected.lastActive}</p>
            </div>
            <div className="flex gap-6 ml-auto text-center">
              <div><p className="font-black text-xl text-green-600">৳{selected.ltv.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Spent</p></div>
              <div><p className="font-black text-xl">{selected.orders}</p><p className="text-xs text-muted-foreground">Orders</p></div>
              <div><span className={`font-bold px-2 py-1 rounded-lg text-sm ${SEGMENT_COLORS[selected.segment]}`}>{selected.segment}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-bold text-sm mb-5">Journey Timeline</h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {events.map((ev, i) => {
                  const Icon = EVENT_ICONS[ev.type];
                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 z-10 ${EVENT_COLORS[ev.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{ev.label}</p>
                            <p className="text-xs text-muted-foreground">{ev.detail}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{ev.time}</p>
                            {ev.value && <p className="text-sm font-bold text-green-600">৳{ev.value.toLocaleString()}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
