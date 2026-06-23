'use client';

import { useState } from 'react';
import {
  MapPin, ShoppingBag, Package, Clock, CheckCircle2,
  Truck, Edit2, Trash2, AlertTriangle, BarChart2, Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoneStatus = 'Active' | 'Inactive';
type OrderStatus = 'Assigned' | 'Picked' | 'Delivered';

interface Zone {
  id: string;
  name: string;
  coverage: string;
  deliveryFee: number;
  active: boolean;
}

interface QCOrder {
  id: string;
  item: string;
  zone: string;
  placedAt: string;
  status: OrderStatus;
  estimatedTime: string;
}

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  category: string;
}

interface TimeSlot {
  hour: string;
  capacity: number;
  booked: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ZONES: Zone[] = [
  { id: '1', name: 'Gulshan', coverage: 'Gulshan 1 & 2, Niketan', deliveryFee: 30, active: true },
  { id: '2', name: 'Banani', coverage: 'Banani, DOHS Banani', deliveryFee: 30, active: true },
  { id: '3', name: 'Dhanmondi', coverage: 'Dhanmondi 1–27, Jigatola', deliveryFee: 40, active: true },
  { id: '4', name: 'Mirpur', coverage: 'Mirpur 1, 2, 10, 11, 12', deliveryFee: 50, active: false },
];

const MOCK_ORDERS: QCOrder[] = [
  { id: 'QC-1001', item: 'Organic Milk 1L', zone: 'Gulshan', placedAt: '9:05 AM', status: 'Delivered', estimatedTime: '25 min' },
  { id: 'QC-1002', item: 'Fresh Bread Loaf', zone: 'Banani', placedAt: '9:22 AM', status: 'Picked', estimatedTime: '15 min' },
  { id: 'QC-1003', item: 'Eggs (12 pack)', zone: 'Dhanmondi', placedAt: '9:45 AM', status: 'Assigned', estimatedTime: '28 min' },
  { id: 'QC-1004', item: 'Mineral Water 2L', zone: 'Gulshan', placedAt: '9:51 AM', status: 'Assigned', estimatedTime: '20 min' },
  { id: 'QC-1005', item: 'Green Tea (20 bags)', zone: 'Banani', placedAt: '10:02 AM', status: 'Picked', estimatedTime: '12 min' },
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Organic Milk 1L', stock: 4, threshold: 10, category: 'Dairy' },
  { id: '2', name: 'Fresh Bread Loaf', stock: 12, threshold: 8, category: 'Bakery' },
  { id: '3', name: 'Eggs (12 pack)', stock: 2, threshold: 5, category: 'Dairy' },
  { id: '4', name: 'Mineral Water 2L', stock: 30, threshold: 15, category: 'Beverages' },
  { id: '5', name: 'Greek Yogurt 500g', stock: 3, threshold: 6, category: 'Dairy' },
  { id: '6', name: 'Banana (dozen)', stock: 0, threshold: 4, category: 'Fruits' },
  { id: '7', name: 'Green Tea (20 bags)', stock: 18, threshold: 10, category: 'Beverages' },
  { id: '8', name: 'Butter 100g', stock: 7, threshold: 5, category: 'Dairy' },
];

const HOURS = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'];
const MOCK_SLOTS: TimeSlot[] = HOURS.map((hour, i) => ({
  hour,
  capacity: 20,
  booked: [8, 14, 18, 20, 12, 9, 17, 15, 11, 7, 5, 3, 1][i] ?? 0,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient }: {
  label: string; value: string; sub: string; icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: gradient }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="text-2xl font-black mt-1.5 tracking-tight">{value}</p>
          <p className="text-xs mt-1.5 opacity-80">{sub}</p>
        </div>
        <div className="rounded-xl p-3 flex-shrink-0 ml-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    Assigned:  { bg: '#fef3c7', color: '#92400e', icon: <Clock className="w-3 h-3" /> },
    Picked:    { bg: '#dbeafe', color: '#1e40af', icon: <Truck className="w-3 h-3" /> },
    Delivered: { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="w-3 h-3" /> },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.icon}{status}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Zones', 'Orders', 'Inventory', 'Time Slots'] as const;
type Tab = typeof TABS[number];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminQuickCommercePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Zones');
  const [zoneStates, setZoneStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_ZONES.map(z => [z.id, z.active]))
  );

  const toggleZone = (id: string) => {
    setZoneStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = [
    { label: 'Active Zones', value: String(Object.values(zoneStates).filter(Boolean).length), sub: `${MOCK_ZONES.length} zones total`, icon: <MapPin className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #0284c7, #4f46e5)' },
    { label: "Today's Orders", value: '247', sub: '38 in progress right now', icon: <ShoppingBag className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #059669, #0d9488)' },
    { label: 'Avg Delivery Time', value: '22 min', sub: 'Target: ≤ 30 min', icon: <Clock className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #d97706, #b45309)' },
    { label: 'On-Time Rate', value: '94.2%', sub: '↑ 1.8% vs yesterday', icon: <Zap className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Quick Commerce Admin</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">
              <Zap className="h-3 w-3" />
              10–30 min delivery
            </span>
          </div>
          <p className="text-sm text-gray-500">Manage express delivery zones, live orders, inventory, and time slots</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Zones Tab ──────────────────────────────────────────────── */}
          {activeTab === 'Zones' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-l-xl">Zone Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Coverage Area</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Delivery Fee</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Active</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_ZONES.map(zone => (
                    <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{zone.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{zone.coverage}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">৳{zone.deliveryFee}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleZone(zone.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${zoneStates[zone.id] ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${zoneStates[zone.id] ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Orders Tab ─────────────────────────────────────────────── */}
          {activeTab === 'Orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-l-xl">Order ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Item</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Zone</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Placed At</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Est. Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_ORDERS.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-700">{order.id}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-800">{order.item}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-blue-400" />{order.zone}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{order.placedAt}</td>
                      <td className="px-4 py-3.5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                          <Clock className="w-3 h-3 text-orange-400" />{order.estimatedTime}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <Truck className="w-3 h-3" /> Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Inventory Tab ──────────────────────────────────────────── */}
          {activeTab === 'Inventory' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Express-Eligible Products</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Items available for Quick Commerce delivery</p>
                </div>
                <span className="text-xs text-red-600 font-semibold bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
                  {MOCK_INVENTORY.filter(i => i.stock <= i.threshold).length} items low / out of stock
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {MOCK_INVENTORY.map(item => {
                  const isLow = item.stock <= item.threshold;
                  const pct = item.threshold > 0 ? Math.min((item.stock / (item.threshold * 2)) * 100, 100) : 100;
                  return (
                    <div key={item.id} className={`rounded-2xl p-4 border-2 transition-all ${isLow ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'} hover:shadow-md`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-2" style={{ background: isLow ? '#fee2e2' : '#eff6ff' }}>
                          <Package className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-blue-500'}`} />
                        </div>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className={`text-2xl font-black ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{item.stock}</p>
                          <p className="text-xs text-gray-400">in stock · threshold {item.threshold}</p>
                        </div>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {item.stock === 0 ? 'OUT' : 'LOW'}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: isLow ? '#ef4444' : '#3b82f6' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Time Slots Tab ─────────────────────────────────────────── */}
          {activeTab === 'Time Slots' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-800">Delivery Time Slots</h2>
                <p className="text-sm text-gray-500 mt-0.5">Hourly slot capacity and current bookings (9 AM – 9 PM)</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {MOCK_SLOTS.map(slot => {
                  const fillPct = slot.capacity > 0 ? (slot.booked / slot.capacity) * 100 : 0;
                  const isFull = fillPct >= 100;
                  const isHigh = fillPct >= 80;
                  const slotColor = isFull ? '#dc2626' : isHigh ? '#d97706' : '#2563eb';
                  const slotBg = isFull ? '#fee2e2' : isHigh ? '#fef3c7' : '#eff6ff';
                  return (
                    <div key={slot.hour} className="rounded-2xl p-4 border-2 transition-all hover:shadow-md text-center" style={{ borderColor: slotColor + '40', background: slotBg }}>
                      <p className="text-xs font-bold text-gray-500 mb-2">{slot.hour}</p>
                      <div className="relative w-14 h-14 mx-auto mb-2">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                          <circle
                            cx="28" cy="28" r="22"
                            fill="none"
                            stroke={slotColor}
                            strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - fillPct / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-black" style={{ color: slotColor }}>{slot.booked}</span>
                          <span className="text-[9px] text-gray-400 font-medium">/{slot.capacity}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-semibold" style={{ color: slotColor }}>
                        {isFull ? 'Full' : isHigh ? 'High' : `${slot.capacity - slot.booked} left`}
                      </p>
                      <div className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: slotColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> High demand (≥80%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Full (100%)</span>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <BarChart2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Peak Hours: 12 PM – 2 PM</p>
                  <p className="text-xs text-blue-600 mt-0.5">Consider increasing rider allocation during these hours to maintain on-time delivery rates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
